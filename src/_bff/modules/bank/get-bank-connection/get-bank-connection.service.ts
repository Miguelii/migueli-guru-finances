import { Effect } from 'effect'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { CreateSbClientError, SbQueryError } from '@/_bff/common/errors/shared.errors'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { Logger } from '@/_bff/common/logger/logger'
import type { BankBalanceSummary } from '@/types/BankConnection'
import { getEnableBankingConfig } from '@/_bff/modules/bank/helpers/enable-banking-config.helper'
import { getBankConnectionByUserIdFn } from '@/_bff/modules/bank/bank.repository'

const NOT_CONNECTED_SUMMARY = {
    loadFailed: false,
    isConnected: false,
    balance: null,
    currency: null,
    balanceUpdatedAt: null,
    consentValidUntil: null,
    lastSyncStatus: null,
} as const satisfies Omit<BankBalanceSummary, 'isConfigured'>

const readBankConnection = Effect.fn('readBankConnection')(function* (userId: string) {
    const bd = yield* Effect.tryPromise({
        try: () => createDBServerClient(),
        catch: (cause) => new CreateSbClientError({ cause, error_hash: ErrorCode.BANK_DB_CLIENT }),
    })

    const connection = yield* Effect.tryPromise({
        try: () => getBankConnectionByUserIdFn(bd, userId)(),
        catch: (cause) => new SbQueryError({ cause, error_hash: ErrorCode.BANK_GET_QUERY }),
    })

    if (!connection?.account_uid) {
        return { isConfigured: true, ...NOT_CONNECTED_SUMMARY } satisfies BankBalanceSummary
    }

    return {
        isConfigured: true,
        loadFailed: false,
        isConnected: true,
        balance: connection.balance === null ? null : Number(connection.balance),
        currency: connection.currency,
        balanceUpdatedAt: connection.balance_updated_at,
        consentValidUntil: connection.consent_valid_until,
        lastSyncStatus: connection.last_sync_status,
    } satisfies BankBalanceSummary
})

// Never fails: the bank card is secondary, so a read failure degrades only the card
// (error state) instead of taking down the whole portfolio page
export const getBankConnection = Effect.fn('getBankConnection')(function* (userId: string) {
    if (!getEnableBankingConfig()) {
        return { isConfigured: false, ...NOT_CONNECTED_SUMMARY } satisfies BankBalanceSummary
    }

    return yield* readBankConnection(userId).pipe(
        Effect.catchAll((error) => {
            Logger({
                level: 'error',
                prefix: 'getBankConnection',
                message: `${error._tag} failed`,
                error,
                userId,
            })

            return Effect.succeed({
                isConfigured: true,
                ...NOT_CONNECTED_SUMMARY,
                loadFailed: true,
            } satisfies BankBalanceSummary)
        })
    )
})
