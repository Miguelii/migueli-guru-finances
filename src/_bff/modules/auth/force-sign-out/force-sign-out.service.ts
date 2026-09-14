import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Effect } from 'effect'
import { HOME_PAGE_PATH } from '@/lib/constants'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { Logger } from '@/_bff/common/logger/logger'
import { SignOutError } from '@/_bff/modules/auth/auth.errors'

const SUPABASE_COOKIE_PREFIX = 'sb-'

export const forceSignOut = Effect.fn('forceSignOut')(function* () {
    yield* Effect.gen(function* () {
        const bd = yield* Effect.tryPromise({
            try: () => createDBServerClient(),
            catch: (cause) =>
                new CreateSbClientError({ cause, error_hash: ErrorCode.AUTH_SIGN_OUT_DB_CLIENT }),
        })

        const { error } = yield* Effect.tryPromise({
            try: () => bd.auth.signOut({ scope: 'local' }),
            catch: (cause) =>
                new SignOutError({ cause, error_hash: ErrorCode.AUTH_SIGN_OUT_FAILED }),
        })

        if (error) {
            return yield* new SignOutError({
                cause: error,
                message: error.message,
                error_hash: ErrorCode.AUTH_SIGN_OUT_FAILED,
            })
        }
    }).pipe(
        Effect.catchAll((error) =>
            Effect.sync(() => Logger.warn('[forceSignOut] Supabase sign-out failed', error))
        )
    )

    const cookieStore = yield* Effect.promise(() => cookies())

    yield* Effect.sync(() => {
        cookieStore
            .getAll()
            .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
            .forEach(({ name }) => cookieStore.delete(name))

        revalidatePath(HOME_PAGE_PATH, 'layout')
    })
})
