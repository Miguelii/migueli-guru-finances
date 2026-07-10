import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { getAllTransactionsByUserId } from './get-all-transactions.service'

export const GET_ALL_TRANSACTIONS_PROTECTED_CONTROLLER = protectedProcedure.query(({ ctx }) =>
    runEffect(getAllTransactionsByUserId(ctx.user.id), 'getAllTransactionsByUserId', (error) =>
        Match.value(error).pipe(
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.exhaustive
        )
    )
)
