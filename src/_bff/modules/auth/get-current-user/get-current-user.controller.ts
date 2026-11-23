import { Match } from 'effect'
import { getCurrentUser } from '@/_bff/modules/auth/get-current-user/get-current-user.service'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'

export const GET_CURRENT_USER_PROTECTED_CONTROLLER = protectedProcedure.query(({ ctx }) =>
    runEffect(getCurrentUser(ctx.user), 'getCurrentUser', (error) =>
        Match.value(error).pipe(Match.exhaustive)
    )
)
