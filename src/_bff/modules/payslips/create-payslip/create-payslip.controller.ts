import { createPayslip } from '@/_bff/modules/payslips/create-payslip/create-payslip.service'
import { createPayslipSchema } from '@/_bff/modules/payslips/payslips.dto'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const CREATE_PAYSLIP_PROTECTED_CONTROLLER = protectedProcedure
    .input(createPayslipSchema)
    .mutation(({ ctx, input }) =>
        runEffect(createPayslip(ctx.user.id, input), 'createPayslip', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('PayslipMonthTakenError', () => 'CONFLICT' as const),
                Match.exhaustive
            )
        )
    )
