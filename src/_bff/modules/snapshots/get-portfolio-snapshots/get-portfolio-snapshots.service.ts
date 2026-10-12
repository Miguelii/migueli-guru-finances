import { Effect } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { Logger } from '@/_bff/common/logger/logger'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import { getMonthlySnapshotsByUserIdFn } from '@/_bff/modules/snapshots/snapshots.repository'

const readPortfolioSnapshots = Effect.fn('readPortfolioSnapshots')(function* (userId: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.SNAPSHOTS_DB_CLIENT }),
    })

    return yield* Effect.tryPromise({
        try: () => getMonthlySnapshotsByUserIdFn(bd, userId)(),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.SNAPSHOTS_GET_QUERY }),
    })
})

// Never fails: the value chart is secondary, so a read failure leaves only the chart
// empty instead of taking down the whole portfolio page
export const getPortfolioSnapshots = Effect.fn('getPortfolioSnapshots')(function* (userId: string) {
    return yield* readPortfolioSnapshots(userId).pipe(
        Effect.catch((error) => {
            Logger({
                level: 'error',
                prefix: 'getPortfolioSnapshots',
                message: `${error._tag} failed`,
                error,
                userId,
            })

            return Effect.succeed<PortfolioSnapshotPoint[]>([])
        })
    )
})
