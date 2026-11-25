import { deletePayslip } from '@/_bff/modules/payslips/delete-payslip/delete-payslip.service'
import { deletePayslipSchema } from '@/_bff/modules/payslips/payslips.dto'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { Match } from 'effect'

export const DELETE_PAYSLIP_PROTECTED_CONTROLLER = protectedProcedure
    .input(deletePayslipSchema)
    .mutation(({ ctx, input }) =>
        runEffect(deletePayslip(ctx.user.id, input.id), 'deletePayslip', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
