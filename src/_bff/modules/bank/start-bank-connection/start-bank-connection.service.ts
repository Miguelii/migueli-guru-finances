import { randomUUID } from 'node:crypto'
import { Effect } from 'effect'
import { BANK_CALLBACK_API_PATH } from '@/lib/constants'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { getEnableBankingConfig } from '@/_bff/modules/bank/helpers/enable-banking-config.helper'
import { BankNotConfiguredError } from '@/_bff/modules/bank/bank.errors'
import { upsertPendingState } from '@/_bff/modules/bank/bank.repository'
import { startAuthorization } from '@/_bff/modules/bank/providers/enable-banking.provider'
import { BANK_CONSENT_DAYS } from '@/_bff/modules/bank/bank.constants'

const DAY_MS = 24 * 60 * 60 * 1000

export const startBankConnection = Effect.fn('startBankConnection')(function* (userId: string) {
    const config = getEnableBankingConfig()

    if (!config) {
        return yield* new BankNotConfiguredError({
            cause: null,
            message: 'Enable Banking env vars are missing',
            error_hash: ErrorCode.BANK_NOT_CONFIGURED,
        })
    }

    const state = randomUUID()

    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(true),
        catch: (cause) => new CreateSbClientError({ cause, error_hash: ErrorCode.BANK_DB_CLIENT }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () =>
            upsertPendingState(bd, userId, {
                aspspName: config.aspspName,
                aspspCountry: config.aspspCountry,
                pendingState: state,
            }),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.BANK_UPDATE_QUERY }),
    })

    if (error) {
        return yield* new SbQueryError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.BANK_UPDATE_QUERY,
        })
    }

    const { url } = yield* startAuthorization(config, {
        state,
        validUntil: new Date(Date.now() + BANK_CONSENT_DAYS * DAY_MS).toISOString(),
        redirectUrl: `${config.appUrl}${BANK_CALLBACK_API_PATH}`,
    })

    return { url }
})
