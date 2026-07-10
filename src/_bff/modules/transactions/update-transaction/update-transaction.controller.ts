import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { updateTransactionSchema } from '../transactions.dto'
import { updateTransaction } from './update-transaction.service'

export const UPDATE_TRANSACTION_PROTECTED_CONTROLLER = protectedProcedure
    .input(updateTransactionSchema)
    .mutation(({ ctx, input }) =>
        runEffect(updateTransaction(ctx.user.id, input), 'updateTransaction', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
