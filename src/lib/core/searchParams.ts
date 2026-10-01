import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsBoolean,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    type UrlKeys,
} from 'nuqs/server'
import { DEFAULT_LOG_RANGE, LOG_RANGES } from '@/lib/constants/logs'
import {
    ALL_POSITION_TYPES,
    DEFAULT_POSITION_SORT,
    POSITION_SORT_KEYS,
} from '@/lib/constants/positions'
import { ALL_TRANSACTION_ASSETS, ALL_TRANSACTION_TYPES } from '@/lib/constants/transactions'
import { TickerType, TransactionType } from '@/types/Transaction'
import { LogLevel } from '@/types/Log'

export const paramsUrlKeys: UrlKeys<typeof paramsParsers> = {
    hide_prices: 'hide_prices',
    filter_asset: 'filter_asset',
    filter_year: 'filter_year',
    filter_type: 'filter_type',
    transaction_id: 'transaction_id',
    bank: 'bank',
    logs_range: 'logs_range',
    logs_search: 'logs_search',
    logs_level: 'logs_level',
    logs_source: 'logs_source',
    logs_id: 'logs_id',
    positions_type: 'positions_type',
    positions_sort: 'positions_sort',
    positions_fees: 'positions_fees',
    positions_id: 'positions_id',
}

// Result of the bank connection flow (Enable Banking), set by /api/bank/callback
// Transactions page: client-only filters and the transaction open in the detail drawer
export const transactionTypeParser = parseAsStringLiteral([
    ALL_TRANSACTION_TYPES,
    ...Object.values(TransactionType),
]).withDefault(ALL_TRANSACTION_TYPES)

export const transactionIdParser = parseAsString

export const bankConnectionResultParser = parseAsStringLiteral(['connected', 'error'] as const)

// Logs page: range and search are fetched on the server, level/source/id filter on the client
export const logsLevelParser = parseAsArrayOf(parseAsStringLiteral(Object.values(LogLevel)))

export const logsSourceParser = parseAsString

export const logsIdParser = parseAsString

// Positions page: client-only filters over the holdings already rendered by the server
export const positionsTypeParser = parseAsStringLiteral([
    ALL_POSITION_TYPES,
    ...Object.values(TickerType),
]).withDefault(ALL_POSITION_TYPES)

export const positionsSortParser =
    parseAsStringLiteral(POSITION_SORT_KEYS).withDefault(DEFAULT_POSITION_SORT)

export const positionsFeesParser = parseAsBoolean.withDefault(false)

export const positionsIdParser = parseAsString

const paramsParsers = {
    hide_prices: parseAsBoolean.withDefault(false),
    filter_asset: parseAsString.withDefault(ALL_TRANSACTION_ASSETS),
    filter_year: parseAsInteger.withDefault(new Date().getFullYear()),
    filter_type: transactionTypeParser,
    transaction_id: transactionIdParser,
    bank: bankConnectionResultParser,
    logs_range: parseAsStringLiteral(LOG_RANGES).withDefault(DEFAULT_LOG_RANGE),
    logs_search: parseAsString.withDefault(''),
    logs_level: logsLevelParser.withDefault([]),
    logs_source: logsSourceParser,
    logs_id: logsIdParser,
    positions_type: positionsTypeParser,
    positions_sort: positionsSortParser,
    positions_fees: positionsFeesParser,
    positions_id: positionsIdParser,
} as const

export const searchParamsCache = createSearchParamsCache(paramsParsers)
