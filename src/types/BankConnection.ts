export enum BankSyncStatus {
    Ok = 'OK',
    Expired = 'EXPIRED',
    Error = 'ERROR',
    // 429: daily PSD2 read quota used up, the stored balance is still valid
    RateLimited = 'RATE_LIMITED',
}

export type BankConnection = {
    id: string
    user_id: string
    aspsp_name: string
    aspsp_country: string
    pending_state: string | null
    session_id: string | null
    account_uid: string | null
    consent_valid_until: string | null
    balance: number | null
    currency: string | null
    balance_updated_at: string | null
    last_sync_status: BankSyncStatus | null
    created_at: string
}

export type BankBalanceSummary = {
    isConfigured: boolean
    // The connection could not be read (e.g. DB failure): the card shows an error state
    loadFailed: boolean
    isConnected: boolean
    balance: number | null
    currency: string | null
    balanceUpdatedAt: string | null
    consentValidUntil: string | null
    lastSyncStatus: BankSyncStatus | null
}
