export const GET_BANK_CONNECTION_CACHE_KEY = 'getBankConnection'

export const GET_BANK_CONNECTION_REVALIDATE_TIME = 14400 // 4h

/**
 * Builds the per-user cache tag for the bank connection, so a user's (re)connection
 * only invalidates their own cached entry (the bare cache key stays as a global tag
 * for the sync cron, which updates every user).
 *
 * @param userId - Owner of the cached bank connection
 */
export const getBankConnectionCacheTag = (userId: string) =>
    `${GET_BANK_CONNECTION_CACHE_KEY}:${userId}`

export const ENABLE_BANKING_API_URL = 'https://api.enablebanking.com'

export const ENABLE_BANKING_JWT_TTL_SECONDS = 3600 // API maximum

// Some banks reject consents longer than 90 days (422), keep one day of margin
export const BANK_CONSENT_DAYS = 89

// Most current first: interim available, closing available, interim booked, closing booked, expected
export const BALANCE_TYPE_PRIORITY = ['ITAV', 'CLAV', 'ITBD', 'CLBD', 'XPCD'] as const

// Columns read for the UI (never session_id / pending_state)
export const BANK_CONNECTION_PUBLIC_COLUMNS =
    'account_uid, balance, currency, balance_updated_at, consent_valid_until, last_sync_status'
