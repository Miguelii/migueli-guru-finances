export const GET_ALL_TRANSACTIONS_CACHE_KEY = 'getAllTransactions'

export const GET_ALL_TRANSACTIONS_REVALIDATE_TIME = 14400 // 4h

/**
 * Builds the per-user cache tag for the transactions list, so a user's mutation
 * only invalidates their own cached entry (the bare cache key stays as a global
 * tag for flows that must invalidate every user, e.g. the ticker-prices cron).
 *
 * @param userId - Owner of the cached transactions list
 */
export const getAllTransactionsCacheTag = (userId: string) =>
    `${GET_ALL_TRANSACTIONS_CACHE_KEY}:${userId}`
