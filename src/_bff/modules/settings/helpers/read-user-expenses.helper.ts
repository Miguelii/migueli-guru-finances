import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { SbQueryError } from '@/_bff/common/errors/shared.errors'
import type { SbClient } from '@/_bff/common/db/types'
import { storedExpensesSchema } from '@/_bff/modules/settings/settings.dto'
import { selectUserExpenses } from '@/_bff/modules/settings/settings.repository'
import { Effect } from 'effect'

// Latest stored expenses (uncached), the starting point of every expense mutation
export const readUserExpenses = Effect.fn('readUserExpenses')(function* (
    bd: SbClient,
    userId: string
) {
    const { data, error } = yield* Effect.tryPromise({
        try: () => selectUserExpenses(bd, userId),
        catch: (cause) =>
            new SbQueryError({ cause, error_hash: ErrorCode.SETTINGS_EXPENSES_READ_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.SETTINGS_EXPENSES_READ_QUERY,
        })
    }

    return storedExpensesSchema.parse(data?.monthly_expenses ?? [])
})
