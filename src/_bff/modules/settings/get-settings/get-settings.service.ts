import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { toUserSettings } from '@/_bff/modules/settings/helpers/to-user-settings.helper'
import { getUserSettingsByUserIdFn } from '@/_bff/modules/settings/settings.repository'
import { Effect } from 'effect'

export const getSettings = Effect.fn('getSettings')(function* (userId: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.SETTINGS_DB_CLIENT }),
    })

    const row = yield* Effect.tryPromise({
        try: () => getUserSettingsByUserIdFn(bd, userId)(),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.SETTINGS_GET_QUERY }),
    })

    return toUserSettings(row)
})
