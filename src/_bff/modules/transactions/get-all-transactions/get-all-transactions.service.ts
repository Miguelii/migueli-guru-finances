import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { getAllTransactionsByUserIdFn } from '@/_bff/modules/transactions/transactions.repository'
import { Effect } from 'effect'

export const getAllTransactionsByUserId = Effect.fn('getAllTransactionsByUserId')(function* (
    userId: string
) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.TRANSACTIONS_DB_CLIENT }),
    })

    const data = yield* Effect.tryPromise({
        try: () => getAllTransactionsByUserIdFn(bd, userId)(),
        catch: (cause) =>
            new SbQueryError({ cause, error_hash: ErrorCode.TRANSACTIONS_GET_ALL_QUERY }),
    })

    return data ?? []
})
