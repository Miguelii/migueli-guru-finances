import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { getAssets } from './get-assets.service'

export const GET_ASSETS_PROTECTED_CONTROLLER = protectedProcedure.query(({ ctx }) =>
    runEffect(getAssets(ctx.user.id), 'getAssets', (error) =>
        Match.value(error).pipe(
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.exhaustive
        )
    )
)
