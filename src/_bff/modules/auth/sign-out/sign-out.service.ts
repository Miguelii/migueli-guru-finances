import { HOME_PAGE_PATH } from '@/lib/constants'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { revalidatePath } from 'next/cache'
import { Effect } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { SignOutError } from '@/_bff/modules/auth/auth.errors'

export const signOut = Effect.fn('signOut')(function* () {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.AUTH_SIGN_OUT_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => bd.auth.signOut(),
        catch: (cause) => new SignOutError({ cause, error_hash: ErrorCode.AUTH_SIGN_OUT_FAILED }),
    })

    if (error) {
        return yield* new SignOutError({
            cause: error,
            message: error?.message,
            error_hash: ErrorCode.AUTH_SIGN_OUT_FAILED,
        })
    }

    revalidatePath(HOME_PAGE_PATH, 'layout')
})
