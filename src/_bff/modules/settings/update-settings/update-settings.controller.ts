import { updateSettingsSchema } from '@/_bff/modules/settings/settings.dto'
import { updateSettings } from '@/_bff/modules/settings/update-settings/update-settings.service'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const UPDATE_SETTINGS_PROTECTED_CONTROLLER = protectedProcedure
    .input(updateSettingsSchema)
    .mutation(({ ctx, input }) =>
        runEffect(updateSettings(ctx.user.id, input), 'updateSettings', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
