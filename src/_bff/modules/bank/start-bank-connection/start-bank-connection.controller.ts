import { Match } from 'effect'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { startBankConnection } from '@/_bff/modules/bank/start-bank-connection/start-bank-connection.service'

export const START_BANK_CONNECTION_PROTECTED_CONTROLLER = protectedProcedure.mutation(({ ctx }) =>
    runEffect(startBankConnection(ctx.user.id), 'startBankConnection', (error) =>
        Match.value(error).pipe(
            Match.tag('BankNotConfiguredError', () => 'PRECONDITION_FAILED' as const),
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
            // A 401/403 from Enable Banking here means a bad app key, not an invalid user session
            Match.tag('EnableBankingConsentError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('EnableBankingRateLimitError', () => 'TOO_MANY_REQUESTS' as const),
            Match.tag('EnableBankingRequestError', () => 'BAD_GATEWAY' as const),
            Match.tag('EnableBankingUnavailableError', () => 'SERVICE_UNAVAILABLE' as const),
            Match.exhaustive
        )
    )
)
