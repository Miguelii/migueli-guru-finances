import { GET_ASSETS_CACHE_KEY } from '@/_bff/modules/assets/assets.constants'
import { GET_BANK_CONNECTION_CACHE_KEY } from '@/_bff/modules/bank/bank.constants'
import {
    GET_ASSET_EVENTS_CACHE_KEY,
    GET_ASSET_NEWS_CACHE_KEY,
} from '@/_bff/modules/news/news.constants'
import { GET_PAYSLIPS_CACHE_KEY } from '@/_bff/modules/payslips/payslips.constants'
import { GET_USER_SETTINGS_CACHE_KEY } from '@/_bff/modules/settings/settings.constants'
import { GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY } from '@/_bff/modules/snapshots/snapshots.constants'
import { GET_ALL_TRANSACTIONS_CACHE_KEY } from '@/_bff/modules/transactions/transactions.constants'

// Every `unstable_cache` key: each one is also the global tag of its cached entries
export const CACHE_KEYS = [
    GET_ASSETS_CACHE_KEY,
    GET_ALL_TRANSACTIONS_CACHE_KEY,
    GET_BANK_CONNECTION_CACHE_KEY,
    GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY,
    GET_ASSET_NEWS_CACHE_KEY,
    GET_ASSET_EVENTS_CACHE_KEY,
    GET_PAYSLIPS_CACHE_KEY,
    GET_USER_SETTINGS_CACHE_KEY,
] as const

export type CacheKey = (typeof CACHE_KEYS)[number]

export const CACHE_KEY_DESCRIPTION: Record<CacheKey, string> = {
    [GET_ASSETS_CACHE_KEY]: 'Assets and current prices (data table, shared by all users)',
    [GET_ALL_TRANSACTIONS_CACHE_KEY]: 'Transactions of every user (transactions table)',
    [GET_BANK_CONNECTION_CACHE_KEY]: 'Bank connection and synced balance (bank_connections table)',
    [GET_PORTFOLIO_SNAPSHOTS_CACHE_KEY]:
        'Month-end portfolio value and invested capital (portfolio_snapshots_monthly view)',
    [GET_ASSET_NEWS_CACHE_KEY]: 'News feed per asset and asset names (Yahoo Finance, Google News)',
    [GET_ASSET_EVENTS_CACHE_KEY]: 'Upcoming earnings and dividend dates per stock (Yahoo Finance)',
    [GET_PAYSLIPS_CACHE_KEY]: 'Monthly payslips of every user (payslips table)',
    [GET_USER_SETTINGS_CACHE_KEY]: 'Salary and goals of every user (user_settings table)',
}
