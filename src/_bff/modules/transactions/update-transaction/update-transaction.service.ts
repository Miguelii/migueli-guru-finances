import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { getAllTransactionsCacheTag } from '@/_bff/modules/transactions/transactions.constants'
import { type UpdateTransactionProps } from '@/_bff/modules/transactions/transactions.dto'
import { updateTransactionById } from '@/_bff/modules/transactions/transactions.repository'
import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'

export const updateTransaction = Effect.fn('updateTransaction')(function* (
    userId: string,
    props: UpdateTransactionProps
) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.TRANSACTIONS_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => updateTransactionById(bd, userId, props),
        catch: (cause) =>
            new SbQueryError({ cause, error_hash: ErrorCode.TRANSACTIONS_UPDATE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error?.message,
            error_hash: ErrorCode.TRANSACTIONS_UPDATE_QUERY,
        })
    }

    revalidateTag(getAllTransactionsCacheTag(userId), 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')
})
