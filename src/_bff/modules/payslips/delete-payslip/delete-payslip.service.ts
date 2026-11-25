import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { getPayslipsCacheTag } from '@/_bff/modules/payslips/payslips.constants'
import { deletePayslipById } from '@/_bff/modules/payslips/payslips.repository'
import { Effect } from 'effect'
import { expireCacheTags } from '@/_bff/common/cache/expire-cache-tags.helper'

export const deletePayslip = Effect.fn('deletePayslip')(function* (userId: string, id: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.PAYSLIPS_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () => deletePayslipById(bd, userId, id),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.PAYSLIPS_DELETE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.PAYSLIPS_DELETE_QUERY,
        })
    }

    expireCacheTags(getPayslipsCacheTag(userId))
})
