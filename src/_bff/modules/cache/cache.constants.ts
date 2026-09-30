import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { GET_BANK_CONNECTION_CACHE_KEY } from '@/_bff/modules/bank/bank.constants'
import { GET_ALL_TRANSACTIONS_CACHE_KEY } from '@/_bff/modules/transactions/transactions.constants'

// Every `unstable_cache` key: each one is also the global tag of its cached entries
export const CACHE_KEYS = [
    GET_ASSETS_CACHE_KEY,
    GET_ALL_TRANSACTIONS_CACHE_KEY,
    GET_BANK_CONNECTION_CACHE_KEY,
] as const

export type CacheKey = (typeof CACHE_KEYS)[number]

export const CACHE_KEY_DESCRIPTION: Record<CacheKey, string> = {
    [GET_ASSETS_CACHE_KEY]: 'Assets and current prices (data table, shared by all users)',
    [GET_ALL_TRANSACTIONS_CACHE_KEY]: 'Transactions of every user (transactions table)',
    [GET_BANK_CONNECTION_CACHE_KEY]: 'Bank connection and synced balance (bank_connections table)',
}
