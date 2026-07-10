import { HOME_PAGE_PATH } from '@/lib/constants'
import { createSbServerClient } from '@/_bff/common/supabase/supabase.client'
import { revalidatePath } from 'next/cache'
import { Effect } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { SignOutError } from '@/_bff/modules/auth/auth.errors'

export const signOut = Effect.fn('signOut')(function* () {
    const supabase = yield* Effect.tryPromise({
        try: () => createSbServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.AUTH_SIGN_OUT_SB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => supabase.auth.signOut(),
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
