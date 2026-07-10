import { loginSchema } from '@/_bff/modules/auth/auth.dto'
import { publicProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { login } from './login.service'

export const LOGIN_PUBLIC_CONTROLLER = publicProcedure.input(loginSchema).mutation(({ input }) =>
    runEffect(login(input), 'login', (error) =>
        Match.value(error).pipe(
            Match.tag('IsBotError', () => 'FORBIDDEN' as const),
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SignInWithPasswordError', () => 'UNAUTHORIZED' as const),
            Match.exhaustive
        )
    )
)
