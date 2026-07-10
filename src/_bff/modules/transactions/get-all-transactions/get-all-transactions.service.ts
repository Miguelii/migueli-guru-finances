import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createSbServerClient } from '@/_bff/common/supabase/supabase.client'
import { getAllTransactionsByUserIdFn } from '@/_bff/modules/transactions/transactions.repository'
import { Effect } from 'effect'

export const getAllTransactionsByUserId = Effect.fn('getAllTransactionsByUserId')(function* (
    userId: string
) {
    const supabase = yield* Effect.tryPromise({
        try: () => createSbServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.TRANSACTIONS_SB_CLIENT }),
    })

    const data = yield* Effect.tryPromise({
        try: () => getAllTransactionsByUserIdFn(supabase, userId)(),
        catch: (cause) =>
            new SbQueryError({ cause, error_hash: ErrorCode.TRANSACTIONS_GET_ALL_QUERY }),
    })

    return data ?? []
})
