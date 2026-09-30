import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { getLogsSchema } from '@/_bff/modules/logs/logs.dto'
import { getLogs } from '@/_bff/modules/logs/get-logs/get-logs.service'
import { Match } from 'effect'

export const GET_LOGS_PROTECTED_CONTROLLER = protectedProcedure
    .input(getLogsSchema)
    .query(({ input }) =>
        runEffect(getLogs(input), 'getLogs', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
