import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { readUserExpenses } from '@/_bff/modules/settings/helpers/read-user-expenses.helper'
import { writeUserExpenses } from '@/_bff/modules/settings/helpers/write-user-expenses.helper'
import { Effect } from 'effect'

export const removeExpense = Effect.fn('removeExpense')(function* (userId: string, id: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.SETTINGS_DB_CLIENT }),
    })

    const expenses = yield* readUserExpenses(bd, userId)
    const remaining = expenses.filter((expense) => expense.id !== id)

    // Already gone (e.g. removed in another tab): nothing to write
    if (remaining.length === expenses.length) return

    yield* writeUserExpenses(bd, userId, remaining)
})
