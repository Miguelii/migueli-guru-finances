import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import type { SbClient } from '@/_bff/common/db/types'
import { Logger } from '@/_bff/common/logger/logger'
import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { SNAPSHOT_TIME_ZONE } from '@/lib/constants/portfolio-snapshots'
import {
    type PriceHistory,
    addDaysToDateKey,
    buildHistoricalSnapshots,
    toDateKey,
} from '@/lib/portfolio/portfolio-snapshots'
import { TickerType } from '@/types/core/TickerType'
import type { TickerData } from '@/types/Transaction'
import { getCoinbasePriceHistory } from '@/_bff/modules/assets/providers/coinbase.provider'
import { getFinancePriceHistory } from '@/_bff/modules/assets/providers/yahoo.provider'
import {
    PRICE_HISTORY_CONCURRENCY,
    PRICE_HISTORY_RETRY_POLICY,
    UPSERT_CHUNK_SIZE,
    getPortfolioSnapshotsCacheTag,
} from '@/_bff/modules/snapshots/snapshots.constants'
import {
    deleteAllSnapshotsByUserId,
    deleteSnapshotsBefore,
    selectAllTickers,
    selectTransactionsByUserId,
    upsertSnapshots,
} from '@/_bff/modules/snapshots/snapshots.repository'

type RebuildResult = {
    days: number
    /** Tickers without price history, valued at their last trade price instead */
    missingHistory: string[]
}

const historyFetchers: Record<
    TickerData['service'],
    (tick: TickerData, from: string, to: string) => Effect.Effect<Map<string, number>, Error>
> = {
    coinbase: getCoinbasePriceHistory,
    yahoo: getFinancePriceHistory,
}

/**
 * Fetches the daily closes of several assets (bounded concurrency, each with retries).
 * An asset whose history fails after all retries is logged and left out, so the
 * snapshots fall back to its trade prices instead of failing the whole rebuild.
 *
 * @param ticks - The assets to fetch
 * @param from - First day, `YYYY-MM-DD`
 * @param to - Last day, `YYYY-MM-DD`
 */
function fetchPriceHistory(ticks: TickerData[], from: string, to: string) {
    return Effect.forEach(
        ticks,
        (tick) =>
            historyFetchers[tick.service](tick, from, to).pipe(
                Effect.retry(PRICE_HISTORY_RETRY_POLICY),
                Effect.catch((error) => {
                    Logger({
                        level: 'warn',
                        prefix: 'fetchPriceHistory',
                        message: 'price history unavailable',
                        error,
                        metadata: { ticker: tick.ticker, service: tick.service },
                    })
                    return Effect.succeed(new Map<string, number>())
                }),
                Effect.map((closes) => [tick.ticker, closes] as const)
            ),
        { concurrency: PRICE_HISTORY_CONCURRENCY }
    ).pipe(Effect.map((entries): PriceHistory => new Map(entries)))
}

const upsertChunk = Effect.fn('upsertChunk')(function* (
    bd: SbClient,
    snapshots: Parameters<typeof upsertSnapshots>[1]
) {
    const { error } = yield* Effect.tryPromise({
        try: () => upsertSnapshots(bd, snapshots),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_UPSERT_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.SNAPSHOTS_UPSERT_QUERY,
        })
    }
})

// Recomputes every past day (first transaction until yesterday) from historical closes,
// replacing the stored rows. Today stays with the hourly cron
export const rebuildPortfolioSnapshots = Effect.fn('rebuildPortfolioSnapshots')(function* (
    userId: string
) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(true),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.SNAPSHOTS_DB_CLIENT }),
    })

    const { data: tickerRows, error } = yield* Effect.tryPromise({
        try: () => selectAllTickers(bd),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_SOURCE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.SNAPSHOTS_SOURCE_QUERY,
        })
    }

    const transactions = yield* Effect.tryPromise({
        try: () => selectTransactionsByUserId(bd, userId),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_SOURCE_QUERY }),
    })

    const firstDay = transactions
        .map((tx) => tx.buy_date.slice(0, 10))
        .reduce<string | null>((min, day) => (min === null || day < min ? day : min), null)

    const { error: deleteError } = yield* Effect.tryPromise({
        try: () =>
            firstDay === null
                ? deleteAllSnapshotsByUserId(bd, userId)
                : deleteSnapshotsBefore(bd, userId, firstDay),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_DELETE_QUERY }),
    })

    if (deleteError) {
        return yield* new SbQueryError({
            cause: deleteError,
            message: deleteError.message,
            error_hash: ErrorCode.SNAPSHOTS_DELETE_QUERY,
        })
    }

    const tickers = (tickerRows ?? []) as TickerData[]
    const yesterday = addDaysToDateKey(toDateKey(new Date(), SNAPSHOT_TIME_ZONE), -1)
    const result: RebuildResult = { days: 0, missingHistory: [] }

    if (firstDay !== null && firstDay <= yesterday) {
        const heldTickers = new Set(transactions.map((tx) => tx.ticker_id))
        const historyTickers = tickers.filter(
            (tick) =>
                (heldTickers.has(tick.ticker) || tick.type === TickerType.Cambio) &&
                tick.service in historyFetchers
        )

        const priceHistory = yield* fetchPriceHistory(historyTickers, firstDay, yesterday)
        const points = buildHistoricalSnapshots(transactions, tickers, priceHistory, yesterday)
        const snapshots = points.map((point) => ({ ...point, userId }))

        for (let start = 0; start < snapshots.length; start += UPSERT_CHUNK_SIZE) {
            yield* upsertChunk(bd, snapshots.slice(start, start + UPSERT_CHUNK_SIZE))
        }

        result.days = points.length
        result.missingHistory = historyTickers
            .filter((tick) => !priceHistory.get(tick.ticker)?.size)
            .map((tick) => tick.ticker)
    }

    revalidateTag(getPortfolioSnapshotsCacheTag(userId), 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')

    return result
})
