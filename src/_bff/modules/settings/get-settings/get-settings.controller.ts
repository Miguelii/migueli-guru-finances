import { getSettings } from '@/_bff/modules/settings/get-settings/get-settings.service'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const GET_SETTINGS_PROTECTED_CONTROLLER = protectedProcedure.query(({ ctx }) =>
    runEffect(getSettings(ctx.user.id), 'getSettings', (error) =>
        Match.value(error).pipe(
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.exhaustive
        )
    )
)
