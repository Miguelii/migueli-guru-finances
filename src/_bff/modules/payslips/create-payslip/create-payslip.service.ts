import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import {
    getPayslipsCacheTag,
    UNIQUE_VIOLATION_CODE,
} from '@/_bff/modules/payslips/payslips.constants'
import { type CreatePayslipProps } from '@/_bff/modules/payslips/payslips.dto'
import { PayslipMonthTakenError } from '@/_bff/modules/payslips/payslips.errors'
import { insertPayslip } from '@/_bff/modules/payslips/payslips.repository'
import { Effect } from 'effect'
import { expireCacheTags } from '@/_bff/common/cache/expire-cache-tags.helper'

export const createPayslip = Effect.fn('createPayslip')(function* (
    userId: string,
    props: CreatePayslipProps
) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.PAYSLIPS_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => insertPayslip(bd, userId, props),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.PAYSLIPS_CREATE_QUERY }),
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
            error_hash: ErrorCode.PAYSLIPS_CREATE_QUERY,
        })
    }

    expireCacheTags(getPayslipsCacheTag(userId))
})
