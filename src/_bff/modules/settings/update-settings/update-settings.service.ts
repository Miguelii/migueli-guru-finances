import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { getUserSettingsCacheTag } from '@/_bff/modules/settings/settings.constants'
import { type UpdateSettingsProps } from '@/_bff/modules/settings/settings.dto'
import { upsertUserSettings } from '@/_bff/modules/settings/settings.repository'
import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'

export const updateSettings = Effect.fn('updateSettings')(function* (
    userId: string,
    props: UpdateSettingsProps
) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.SETTINGS_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => upsertUserSettings(bd, userId, props),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.SETTINGS_UPDATE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.SETTINGS_UPDATE_QUERY,
        })
    }

    revalidateTag(getUserSettingsCacheTag(userId), 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')
})
