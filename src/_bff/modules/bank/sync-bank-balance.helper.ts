import 'server-only'

import { Effect } from 'effect'
import type { SbClient } from '@/_bff/common/db/types'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { SbQueryError } from '@/_bff/common/errors/shared.errors'
import { Logger } from '@/_bff/common/logger/logger'
import { BankSyncStatus } from '@/types/BankConnection'
import type { EnableBankingConfig } from '@/_bff/modules/bank/enable-banking-config.helper'
import { EnableBankingRequestError } from '@/_bff/modules/bank/bank.errors'
import { getAccountBalances } from '@/_bff/modules/bank/providers/enable-banking.provider'
import { pickBalance } from '@/_bff/modules/bank/pick-balance.helper'
import {
    type ActiveBankConnection,
    updateConnectionBalance,
    updateConnectionStatus,
} from '@/_bff/modules/bank/bank.repository'

function markStatus(supabaseClient: SbClient, id: string, status: BankSyncStatus) {
    return Effect.tryPromise(() => updateConnectionStatus(supabaseClient, id, status)).pipe(
        Effect.flatMap(({ error }) => (error ? Effect.fail(error) : Effect.void)),
        Effect.catchAll((error) =>
            Effect.sync(() => Logger.error(`[syncBankBalance] status update failed [${id}]`, error))
        )
    )
}

/**
 * Reads the account balance from Enable Banking and stores it. Skips the API call when
 * the consent already expired (saves the daily PSD2 quota). Never fails: a revoked or
 * expired consent is stored as `EXPIRED`, any other failure as `ERROR`.
 *
 * @param supabaseClient - Service-role client
 * @param config - Enable Banking settings
 * @param connection - Connection with an authorized account
 */
export function syncBankBalance(
    supabaseClient: SbClient,
    config: EnableBankingConfig,
    connection: ActiveBankConnection
): Effect.Effect<void> {
    const { id, account_uid: accountUid, consent_valid_until: consentValidUntil } = connection

    const isConsentExpired =
        consentValidUntil !== null && new Date(consentValidUntil).getTime() <= Date.now()

    if (!accountUid || isConsentExpired) {
        return markStatus(supabaseClient, id, BankSyncStatus.Expired)
    }

    return Effect.gen(function* () {
        const balances = yield* getAccountBalances(config, accountUid)
        const picked = pickBalance(balances)

        if (!picked) {
            return yield* new EnableBankingRequestError({
                cause: balances,
                message: 'No usable balance returned',
                error_hash: ErrorCode.BANK_BALANCES_REQUEST,
            })
        }

        const { error } = yield* Effect.tryPromise({
            try: () =>
                updateConnectionBalance(supabaseClient, id, {
                    balance: picked.amount,
                    currency: picked.currency,
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
    }).pipe(
        Effect.catchAll((error) => {
            Logger.error(`[syncBankBalance Effect] [${error._tag}] failed for [${id}]`, error)

            return markStatus(
                supabaseClient,
                id,
                error._tag === 'EnableBankingConsentError'
                    ? BankSyncStatus.Expired
                    : BankSyncStatus.Error
            )
        })
    )
}
