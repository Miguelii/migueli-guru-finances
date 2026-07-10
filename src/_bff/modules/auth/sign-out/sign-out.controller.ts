import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { signOut } from './sign-out.service'

export const SIGN_OUT_PROTECTED_CONTROLLER = protectedProcedure.mutation(() =>
    runEffect(signOut(), 'signOut', (error) =>
        Match.value(error).pipe(
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SignOutError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.exhaustive
        )
    )
)
