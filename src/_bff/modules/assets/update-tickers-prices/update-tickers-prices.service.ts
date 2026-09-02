import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { Logger } from '@/_bff/common/logger/logger'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { type TickerData } from '@/types/Transaction'
import type { SbClient } from '@/_bff/common/db/types'
import { Effect, Schedule } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { IsBotError } from '@/_bff/modules/auth/auth.errors'
import { UpdateTickersError } from '@/_bff/modules/assets/assets.errors'
import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { GET_ALL_TRANSACTIONS_CACHE_KEY } from '@/_bff/modules/transactions/transactions.constants'
import { getCoinbasePrice } from '@/_bff/modules/assets/providers/coinbase.provider'
import { getFinancePrice } from '@/_bff/modules/assets/providers/yahoo.provider'
import { selectAllTickers, updateAssetPrice } from '@/_bff/modules/assets/assets.repository'
import { revalidatePath, revalidateTag } from 'next/cache'
import { checkBotId } from 'botid/server'

type UpdateReturn = {
    success: boolean
    status: number
}

const priceFetchers: Record<
    TickerData['service'],
    (tick: TickerData) => Effect.Effect<number | null, Error>
> = {
    coinbase: getCoinbasePrice,
    yahoo: getFinancePrice,
}

/**
 * Retry policy with exponential backoff starting at 2 seconds, jittered (80%-120%),
 * limited to 2 retries. Approximate delays: ~2s → ~4s (total max wait: ~6s before giving up).
 * Jitter prevents thundering herd when multiple tickers retry concurrently.
 */
const retryPolicy = Schedule.exponential('2 second').pipe(
    Schedule.jittered,
    Schedule.intersect(Schedule.recurs(2))
)

/**
 * Fetches all assets and updates each one concurrently using Effect's `forEach` with unbounded concurrency.
 * Uses Effect for retry logic on external API calls with exponential backoff.
 *
 * @returns A promise resolving to `{ success, status }` — always resolves, never rejects
 */
export async function updateTickersPrices(): Promise<UpdateReturn> {
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

        yield* Effect.forEach(tickers, (t) => updateTicker(bd, t), {
            concurrency: 'unbounded',
        })

        return {
            success: true,
            status: 200,
        } satisfies UpdateReturn
    }).pipe(
        Effect.catchAll((error) => {
            Logger.error(`[updateTickersPrices Effect] [${error?._tag}] failed`, error)
            return Effect.succeed({
                success: false,
                status: 207,
            } satisfies UpdateReturn)
        })
    )

    return Effect.runPromise(program)
}

/**
 * Fetches the price for a asset with retry logic and exponential backoff.
 * Selects the appropriate fetcher based on `tick.service`, applies the {@link retryPolicy},
 * and returns `null` on failure after all retries are exhausted.
 *
 * @param tick - The asset data to fetch the price for
 * @returns An Effect that always succeeds with a price number or `null`
 */
export function fetchPrice(tick: TickerData): Effect.Effect<number | null> {
    const fetcher = priceFetchers[tick.service]
    if (!fetcher) return Effect.succeed(null)

    return fetcher(tick).pipe(
        Effect.retry(retryPolicy),
        Effect.catchAll((error) => {
            Logger.error(`[fetchPrice Effect] fetch failed after retries`, error)
            return Effect.succeed(null)
        })
    )
}

/**
 * Updates a asset current price in the Supabase
 * Silently logs and recovers from any errors — never fails the overall pipeline.
 *
 * @param supabaseClient
 * @param tick - The asset data to update
 * @returns An Effect that always succeeds with `void`
 */
function updateTicker(supabaseClient: SbClient, tick: TickerData): Effect.Effect<void> {
    return Effect.gen(function* () {
        const price = yield* fetchPrice(tick)
        if (!price) return

        const { error } = yield* Effect.tryPromise({
            try: () => updateAssetPrice(supabaseClient, tick.ticker, price),
            catch: (cause) => new SbQueryError({ cause }),
        })

        if (error)
            return yield* Effect.fail(new SbQueryError({ cause: error, message: error?.message }))
    }).pipe(
        Effect.catchAll((error) => {
            const errorTag = '_tag' in error ? error._tag : 'Error'
            Logger.error(`[updateTicker Effect] [${errorTag}] failed for [${tick.ticker}]`, error)
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
    const { isBot } = yield* Effect.tryPromise({
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
    }

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
