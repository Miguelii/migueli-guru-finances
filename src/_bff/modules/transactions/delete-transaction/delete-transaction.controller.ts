import { deleteTransactionSchema } from '@/_bff/modules/transactions/transactions.dto'
import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { deleteTransaction } from './delete-transaction.service'

export const DELETE_TRANSACTION_PROTECTED_CONTROLLER = protectedProcedure
    .input(deleteTransactionSchema)
    .mutation(({ ctx, input }) =>
        runEffect(deleteTransaction(ctx.user.id, input.id), 'deleteTransaction', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
