import type { Expense } from '@/types/Expense'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { SbQueryError } from '@/_bff/common/errors/shared.errors'
import type { SbClient } from '@/_bff/common/db/types'
import { getUserSettingsCacheTag } from '@/_bff/modules/settings/settings.constants'
import { upsertUserExpenses } from '@/_bff/modules/settings/settings.repository'
import { Effect } from 'effect'
import { expireCacheTags } from '@/_bff/common/cache/expire-cache-tags.helper'

// Stores the whole expense list and invalidates the user's cached settings
export const writeUserExpenses = Effect.fn('writeUserExpenses')(function* (
    bd: SbClient,
    userId: string,
    expenses: Expense[]
) {
    const { error } = yield* Effect.tryPromise({
        try: () => upsertUserExpenses(bd, userId, expenses),
        catch: (cause) =>
            new SbQueryError({ cause, error_hash: ErrorCode.SETTINGS_EXPENSES_WRITE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.SETTINGS_EXPENSES_WRITE_QUERY,
        })
    }

    expireCacheTags(getUserSettingsCacheTag(userId))
})
