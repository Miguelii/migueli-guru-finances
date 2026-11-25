import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { getPayslipsByUserIdFn } from '@/_bff/modules/payslips/payslips.repository'
import { Effect } from 'effect'

export const getPayslips = Effect.fn('getPayslips')(function* (userId: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) =>
            new CreateSbClientError({ cause, error_hash: ErrorCode.PAYSLIPS_DB_CLIENT }),
    })

    const data = yield* Effect.tryPromise({
        try: () => getPayslipsByUserIdFn(bd, userId)(),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.PAYSLIPS_GET_ALL_QUERY }),
    })

    return data ?? []
})
