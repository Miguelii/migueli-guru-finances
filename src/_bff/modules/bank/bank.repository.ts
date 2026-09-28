import { unstable_cache } from 'next/cache'
import { DBTables } from '@/_bff/common/db/types'
import type { SbClient } from '@/_bff/common/db/types'
import { type BankConnection, BankSyncStatus } from '@/types/BankConnection'
import {
    BANK_CONNECTION_PUBLIC_COLUMNS,
    GET_BANK_CONNECTION_CACHE_KEY,
    GET_BANK_CONNECTION_REVALIDATE_TIME,
    getBankConnectionCacheTag,
} from '@/_bff/modules/bank/bank.constants'

type PublicBankConnection = Pick<
    BankConnection,
    | 'account_uid'
    | 'balance'
    | 'currency'
    | 'balance_updated_at'
    | 'consent_valid_until'
    | 'last_sync_status'
>

export type ActiveBankConnection = Pick<
    BankConnection,
    'id' | 'user_id' | 'account_uid' | 'consent_valid_until'
>

/**
 * Creates a cached function that fetches the user's bank connection (UI columns only).
 *
 * @param supabaseClient
 * @param userId - Scopes the query (`user_id` filter) and the cache key
 */
export const getBankConnectionByUserIdFn = (supabaseClient: SbClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabaseClient
                .from(DBTables.BANK_CONNECTIONS)
                .select(BANK_CONNECTION_PUBLIC_COLUMNS)
                .eq('user_id', userId)
                .maybeSingle()

            if (error) throw error

            return data as PublicBankConnection | null
        },
        [GET_BANK_CONNECTION_CACHE_KEY, userId],
        {
            revalidate: GET_BANK_CONNECTION_REVALIDATE_TIME,
            tags: [GET_BANK_CONNECTION_CACHE_KEY, getBankConnectionCacheTag(userId)],
        }
    )

/**
 * Creates the user's connection row if missing and stores the OAuth `state` of a new
 * authorization attempt. Existing session/balance columns are left untouched.
 *
 * @param supabaseClient - Service-role client
 * @param userId - Owner of the row
 * @param props - Bank identification and the generated `state`
 */
export function upsertPendingState(
    supabaseClient: SbClient,
    userId: string,
    props: { aspspName: string; aspspCountry: string; pendingState: string }
) {
    return supabaseClient.from(DBTables.BANK_CONNECTIONS).upsert(
        {
            user_id: userId,
            aspsp_name: props.aspspName,
            aspsp_country: props.aspspCountry,
            pending_state: props.pendingState,
        },
        { onConflict: 'user_id' }
    )
}

/**
 * Finds the user's connection awaiting the given OAuth `state` (CSRF check of the callback).
 *
 * @param supabaseClient - Service-role client
 * @param userId - Owner of the row
 * @param state - `state` echoed back by Enable Banking
 */
export function findConnectionByPendingState(
    supabaseClient: SbClient,
    userId: string,
    state: string
) {
    return supabaseClient
        .from(DBTables.BANK_CONNECTIONS)
        .select('id, user_id, account_uid, consent_valid_until')
        .eq('user_id', userId)
        .eq('pending_state', state)
        .maybeSingle<ActiveBankConnection>()
}

export function saveBankSession(
    supabaseClient: SbClient,
    id: string,
    props: { sessionId: string; accountUid: string; consentValidUntil: string }
) {
    return supabaseClient
        .from(DBTables.BANK_CONNECTIONS)
        .update({
            session_id: props.sessionId,
            account_uid: props.accountUid,
            consent_valid_until: props.consentValidUntil,
            pending_state: null,
        })
        .eq('id', id)
}

export function selectActiveConnections(supabaseClient: SbClient) {
    return supabaseClient
        .from(DBTables.BANK_CONNECTIONS)
        .select('id, user_id, account_uid, consent_valid_until')
        .not('session_id', 'is', null)
        .not('account_uid', 'is', null)
        .returns<ActiveBankConnection[]>()
}

export function updateConnectionBalance(
    supabaseClient: SbClient,
    id: string,
    props: { balance: number; currency: string }
) {
    return supabaseClient
        .from(DBTables.BANK_CONNECTIONS)
        .update({
            balance: props.balance,
            currency: props.currency,
            balance_updated_at: new Date().toISOString(),
            last_sync_status: BankSyncStatus.Ok,
        })
        .eq('id', id)
}

export function updateConnectionStatus(
    supabaseClient: SbClient,
    id: string,
    status: BankSyncStatus
) {
    return supabaseClient
        .from(DBTables.BANK_CONNECTIONS)
        .update({ last_sync_status: status })
        .eq('id', id)
}
