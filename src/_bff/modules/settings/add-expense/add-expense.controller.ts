import { addExpense } from '@/_bff/modules/settings/add-expense/add-expense.service'
import { addExpenseSchema } from '@/_bff/modules/settings/settings.dto'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const ADD_EXPENSE_PROTECTED_CONTROLLER = protectedProcedure
    .input(addExpenseSchema)
    .mutation(({ ctx, input }) =>
        runEffect(addExpense(ctx.user.id, input), 'addExpense', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('ExpenseLimitReachedError', () => 'BAD_REQUEST' as const),
                Match.exhaustive
            )
        )
    )
