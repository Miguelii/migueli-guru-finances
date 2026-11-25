import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { readUserExpenses } from '@/_bff/modules/settings/helpers/read-user-expenses.helper'
import { writeUserExpenses } from '@/_bff/modules/settings/helpers/write-user-expenses.helper'
import { MAX_MONTHLY_EXPENSES } from '@/_bff/modules/settings/settings.constants'
import type { AddExpenseProps } from '@/_bff/modules/settings/settings.dto'
import { ExpenseLimitReachedError } from '@/_bff/modules/settings/settings.errors'
import { Effect } from 'effect'

export const addExpense = Effect.fn('addExpense')(function* (
    userId: string,
    props: AddExpenseProps
) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.SETTINGS_DB_CLIENT }),
    })

    const expenses = yield* readUserExpenses(bd, userId)

    if (expenses.length >= MAX_MONTHLY_EXPENSES) {
        return yield* new ExpenseLimitReachedError({
            cause: { count: expenses.length },
            error_hash: ErrorCode.SETTINGS_EXPENSES_WRITE_QUERY,
        })
    }

    yield* writeUserExpenses(bd, userId, [...expenses, { ...props, id: crypto.randomUUID() }])
})
