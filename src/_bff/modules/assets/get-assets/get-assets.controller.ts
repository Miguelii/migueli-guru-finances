import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'
import { getAssets } from '@/_bff/modules/assets/get-assets/get-assets.service'

export const GET_ASSETS_PROTECTED_CONTROLLER = protectedProcedure.query(() =>
    runEffect(getAssets(), 'getAssets', (error) =>
        Match.value(error).pipe(
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.exhaustive
        )
    )
)
