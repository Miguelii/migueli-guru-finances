import { removeExpense } from '@/_bff/modules/settings/remove-expense/remove-expense.service'
import { removeExpenseSchema } from '@/_bff/modules/settings/settings.dto'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const REMOVE_EXPENSE_PROTECTED_CONTROLLER = protectedProcedure
    .input(removeExpenseSchema)
    .mutation(({ ctx, input }) =>
        runEffect(removeExpense(ctx.user.id, input.id), 'removeExpense', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
