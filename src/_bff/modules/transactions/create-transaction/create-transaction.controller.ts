import { createTransactionSchema } from '@/_bff/modules/transactions/transactions.dto'
import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { createTransaction } from './create-transaction.service'

export const CREATE_TRANSACTION_PROTECTED_CONTROLLER = protectedProcedure
    .input(createTransactionSchema)
    .mutation(({ ctx, input }) =>
        runEffect(createTransaction(ctx.user.id, input), 'createTransaction', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
