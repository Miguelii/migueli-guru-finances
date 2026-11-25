import { PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import {
    getPayslipsCacheTag,
    UNIQUE_VIOLATION_CODE,
} from '@/_bff/modules/payslips/payslips.constants'
import { type UpdatePayslipProps } from '@/_bff/modules/payslips/payslips.dto'
import { PayslipMonthTakenError } from '@/_bff/modules/payslips/payslips.errors'
import { updatePayslipById } from '@/_bff/modules/payslips/payslips.repository'
import { Effect } from 'effect'
import { revalidatePath, revalidateTag } from 'next/cache'

export const updatePayslip = Effect.fn('updatePayslip')(function* (
    userId: string,
    props: UpdatePayslipProps
) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.PAYSLIPS_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => updatePayslipById(bd, userId, props),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.PAYSLIPS_UPDATE_QUERY }),
    })

    if (error?.code === UNIQUE_VIOLATION_CODE) {
        return yield* new PayslipMonthTakenError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.PAYSLIPS_MONTH_TAKEN,
        })
    }

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.PAYSLIPS_UPDATE_QUERY,
        })
    }

    revalidateTag(getPayslipsCacheTag(userId), 'max')
    revalidatePath(PRIVATE_ROUTE_PATH, 'layout')
})
