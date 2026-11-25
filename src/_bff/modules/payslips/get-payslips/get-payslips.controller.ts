import { getPayslips } from '@/_bff/modules/payslips/get-payslips/get-payslips.service'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const GET_PAYSLIPS_PROTECTED_CONTROLLER = protectedProcedure.query(({ ctx }) =>
    runEffect(getPayslips(ctx.user.id), 'getPayslips', (error) =>
        Match.value(error).pipe(
            Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.exhaustive
        )
    )
)
