import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { checkBotId } from 'botid/server'
import { Effect } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError } from '@/_bff/common/errors/shared.errors'
import { IsBotError, SignInWithPasswordError } from '@/_bff/modules/auth/auth.errors'
import { type LoginProps } from '@/_bff/modules/auth/auth.dto'

export const login = Effect.fn('login')(function* (props: LoginProps) {
    const { isBot } = yield* Effect.tryPromise({
        try: () => checkBotId(),
        catch: (cause) =>
            new IsBotError({
                cause,
                message: 'VERCEL_BOT_PROTECTION',
                error_hash: ErrorCode.AUTH_LOGIN_IS_BOT,
            }),
    })

    if (isBot) {
        return yield* new IsBotError({
            cause: null,
            message: 'Not Acceptable',
            error_hash: ErrorCode.AUTH_LOGIN_IS_BOT,
        })
    }

    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.AUTH_LOGIN_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () =>
            bd.auth.signInWithPassword({
                email: props.email,
                password: props.password,
            }),
        catch: (cause) =>
            new SignInWithPasswordError({ cause, error_hash: ErrorCode.AUTH_LOGIN_SIGN_IN }),
    })

    if (error) {
        return yield* new SignInWithPasswordError({
            cause: error,
            message: error?.message,
            error_hash: ErrorCode.AUTH_LOGIN_SIGN_IN,
        })
    }
})
