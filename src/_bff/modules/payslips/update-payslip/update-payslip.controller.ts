import { updatePayslip } from '@/_bff/modules/payslips/update-payslip/update-payslip.service'
import { updatePayslipSchema } from '@/_bff/modules/payslips/payslips.dto'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const UPDATE_PAYSLIP_PROTECTED_CONTROLLER = protectedProcedure
    .input(updatePayslipSchema)
    .mutation(({ ctx, input }) =>
        runEffect(updatePayslip(ctx.user.id, input), 'updatePayslip', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('PayslipMonthTakenError', () => 'CONFLICT' as const),
                Match.exhaustive
            )
        )
    )
