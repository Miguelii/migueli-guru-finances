import { Effect } from 'effect'
import { expireCacheTags } from '@/_bff/common/cache/expire-cache-tags.helper'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { Logger } from '@/_bff/common/logger/logger'
import { SNAPSHOT_TIME_ZONE } from '@/lib/constants/portfolio-snapshots'
import { computeSnapshotTotals, toDateKey } from '@/lib/portfolio/portfolio-snapshots'
import type { TickerData } from '@/types/Transaction'
import { GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY } from '@/_bff/modules/snapshots/snapshots.constants'
import {
    selectAllTickers,
    selectAllTransactions,
    upsertSnapshots,
} from '@/_bff/modules/snapshots/snapshots.repository'

// Runs after every hourly price update and upserts today's row of every user with
// transactions, so the day keeps the totals of its last run. Never fails: a missed
// snapshot must not turn the price update into an error
export const recordPortfolioSnapshots = Effect.fn('recordPortfolioSnapshots')(
    function* () {
        const bd = yield* Effect.tryPromise({
            try: () => createDBServerClient(true),
            catch: (cause) =>
                new CreateSbClientError({ cause, error_hash: ErrorCode.SNAPSHOTS_DB_CLIENT }),
        })

        const { data: tickerRows, error } = yield* Effect.tryPromise({
            try: () => selectAllTickers(bd),
            catch: (cause) =>
                new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_SOURCE_QUERY }),
        })

        if (error) {
            return yield* new SbQueryError({
                cause: error,
                message: error.message,
                error_hash: ErrorCode.SNAPSHOTS_SOURCE_QUERY,
            })
        }

        const transactions = yield* Effect.tryPromise({
            try: () => selectAllTransactions(bd),
            catch: (cause) =>
                new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_SOURCE_QUERY }),
        })

        // SAFETY: selectAllTickers reads the complete `data` table row, whose stored fields match TickerData.
        const tickers = (tickerRows ?? []) as TickerData[]
        const date = toDateKey(new Date(), SNAPSHOT_TIME_ZONE)
        const snapshots = [...Map.groupBy(transactions, (tx) => tx.user_id)].map(
            ([userId, userTransactions]) => ({
                userId,
                date,
                ...computeSnapshotTotals(userTransactions, tickers),
            })
        )

        if (snapshots.length === 0) return

        const { error: upsertError } = yield* Effect.tryPromise({
            try: () => upsertSnapshots(bd, snapshots),
            catch: (cause) =>
                new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_UPSERT_QUERY }),
        })

        if (upsertError) {
            return yield* new SbQueryError({
                cause: upsertError,
                message: upsertError.message,
                error_hash: ErrorCode.SNAPSHOTS_UPSERT_QUERY,
            })
        }

        expireCacheTags(GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY)
    },
    Effect.catch((error) => {
        Logger({
            level: 'error',
            prefix: 'recordPortfolioSnapshots',
            message: `${error._tag} failed`,
            error,
        })

        return Effect.void
    })
)
