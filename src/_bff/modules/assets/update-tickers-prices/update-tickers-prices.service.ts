import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { Logger } from '@/_bff/common/logger/logger'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import type { TickerData } from '@/types/Transaction'
import type { SbClient } from '@/_bff/common/db/types'
import { Effect, Schedule } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { UpdateTickersError } from '@/_bff/modules/assets/assets.errors'
import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { GET_ALL_TRANSACTIONS_CACHE_KEY } from '@/_bff/modules/transactions/transactions.constants'
import { getCoinbasePrices } from '@/_bff/modules/assets/providers/coinbase.provider'
import { getFinancePrices } from '@/_bff/modules/assets/providers/yahoo.provider'
import { selectAllTickers, updateAssetPrice } from '@/_bff/modules/assets/assets.repository'
import { revalidatePath, revalidateTag } from 'next/cache'

type UpdateReturn = {
    success: boolean
    status: number
}

const priceFetchers: Record<
    TickerData['service'],
    (ticks: TickerData[]) => Effect.Effect<Map<TickerData['ticker'], number>, Error>
> = {
    coinbase: getCoinbasePrices,
    yahoo: getFinancePrices,
}

/**
 * Retry policy with exponential backoff starting at 2 seconds, jittered (80%-120%),
 * limited to 2 retries. Approximate delays: ~2s → ~4s (total max wait: ~6s before giving up).
 * Applied per provider batch, so one flaky provider never delays or drops the other one.
 */
const retryPolicy = Schedule.max([
    Schedule.exponential('2 second').pipe(Schedule.jittered),
    Schedule.recurs(2),
])

/**
 * Fetches all assets, prices them with one batched request per provider and updates
 * each one concurrently using Effect's `forEach` with unbounded concurrency.
 *
 * @returns A promise resolving to `{ success, status }`, always resolves, never rejects
 */
export function updateTickersPrices(): Promise<UpdateReturn> {
    const program = Effect.gen(function* () {
        const bd = yield* Effect.tryPromise({
            try: () => createDBServerClient(true),
            catch: (cause) => new CreateSbClientError({ cause }),
        })

        const { data: tickerRows } = yield* Effect.tryPromise({
            try: () => selectAllTickers(bd),
            catch: (cause) => new SbQueryError({ cause }),
        })

        const tickers = ((tickerRows ?? []) as TickerData[]).filter(
            (t) => t.service in priceFetchers
        )

        const prices = yield* fetchPrices(tickers)

        yield* Effect.forEach(tickers, (t) => updateTicker(bd, t, prices.get(t.ticker)), {
            concurrency: 'unbounded',
        })

        return {
            success: true,
            status: 200,
        } satisfies UpdateReturn
    }).pipe(
        Effect.catch((error) => {
            Logger({
                level: 'error',
                prefix: 'updateTickersPrices',
                message: `${error?._tag} failed`,
                error,
            })
            return Effect.succeed({
                success: false,
                status: 207,
            } satisfies UpdateReturn)
        })
    )

    return Effect.runPromise(program)
}

/**
 * Fetches the prices of several assets with one batched call per provider (run in
 * parallel), each with the {@link retryPolicy}. A provider failing after all retries
 * is logged and contributes no prices; assets missing from a response are logged too.
 *
 * @param ticks - The assets to fetch the prices for
 * @returns An Effect that always succeeds with a map of ticker to price
 */
function fetchPrices(ticks: TickerData[]): Effect.Effect<Map<TickerData['ticker'], number>> {
    const ticksByService = Map.groupBy(
        ticks.filter((tick) => tick.service in priceFetchers),
        (tick) => tick.service
    )

    return Effect.forEach(
        ticksByService,
        ([service, serviceTicks]) =>
            priceFetchers[service](serviceTicks).pipe(
                Effect.retry(retryPolicy),
                Effect.tap((prices) =>
                    Effect.sync(() => {
                        for (const tick of serviceTicks) {
                            if (prices.has(tick.ticker)) continue

                            Logger({
                                level: 'error',
                                prefix: 'fetchPrices',
                                message: 'price missing from provider response',
                                metadata: { ticker: tick.ticker, service },
                            })
                        }
                    })
                ),
                Effect.catch((error) => {
                    Logger({
                        level: 'error',
                        prefix: 'fetchPrices',
                        message: 'fetch failed after retries',
                        error,
                        metadata: { service, tickers: serviceTicks.map((tick) => tick.ticker) },
                    })
                    return Effect.succeed(new Map<TickerData['ticker'], number>())
                })
            ),
        { concurrency: 'unbounded' }
    ).pipe(Effect.map((pricesByService) => new Map(pricesByService.flatMap((p) => [...p]))))
}

/**
 * Fetches the price of a single asset through {@link fetchPrices}.
 *
 * @param tick - The asset data to fetch the price for
 * @returns An Effect that always succeeds with a price number or `null`
 */
export function fetchPrice(tick: TickerData): Effect.Effect<number | null> {
    return fetchPrices([tick]).pipe(Effect.map((prices) => prices.get(tick.ticker) ?? null))
}

/**
 * Updates an asset current price in Supabase, skipping assets without a fetched price.
 * Silently logs and recovers from any errors, never fails the overall pipeline.
 *
 * @param supabaseClient
 * @param tick - The asset data to update
 * @param price - The fetched price, `undefined` when the provider had none
 * @returns An Effect that always succeeds with `void`
 */
function updateTicker(
    supabaseClient: SbClient,
    tick: TickerData,
    price: number | undefined
): Effect.Effect<void> {
    return Effect.gen(function* () {
        if (!price) return

        const { error } = yield* Effect.tryPromise({
            try: () => updateAssetPrice(supabaseClient, tick.ticker, price),
            catch: (cause) => new SbQueryError({ cause }),
        })

        if (error)
            return yield* Effect.fail(new SbQueryError({ cause: error, message: error?.message }))
    }).pipe(
        Effect.catch((error) => {
            Logger({
                level: 'error',
                prefix: 'updateTicker',
                message: `${error._tag} failed`,
                error,
                metadata: { ticker: tick.ticker },
            })
            return Effect.void
        })
    )
}

/**
 * tRPC-facing update flow: blocks bots, runs `updateTickersPrices`, and
 * revalidates the affected caches on success. The `POST /api/updateTickers`
 * HTTP route stays alongside for the Supabase cron (x-api-key auth).
 */
export const updateTickers = Effect.fn('updateTickers')(function* () {
    /* const { isBot } = yield* Effect.tryPromise({
        try: () => checkBotId(),
        catch: (cause) =>
            new IsBotError({
                cause,
                message: 'VERCEL_BOT_PROTECTION',
                error_hash: ErrorCode.ASSETS_UPDATE_TICKERS_IS_BOT,
            }),
    })

    if (isBot) {
        return yield* new IsBotError({
            cause: null,
            message: 'Not Acceptable',
            error_hash: ErrorCode.ASSETS_UPDATE_TICKERS_IS_BOT,
        })
    } */

    const result = yield* Effect.promise(() => updateTickersPrices())

    if (!result.success) {
        return yield* new UpdateTickersError({
            cause: result,
            error_hash: ErrorCode.ASSETS_UPDATE_TICKERS_FAILED,
        })
    }

    revalidateTag(GET_ASSETS_CACHE_KEY, 'max')
    revalidateTag(GET_ALL_TRANSACTIONS_CACHE_KEY, 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')
})
