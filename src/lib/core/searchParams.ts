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
import { LogLevel } from '@/types/Log'

export const paramsUrlKeys: UrlKeys<typeof paramsParsers> = {
    hide_prices: 'hide_prices',
    filter_asset: 'filter_asset',
    filter_year: 'filter_year',
    bank: 'bank',
    logs_range: 'logs_range',
    logs_search: 'logs_search',
    logs_level: 'logs_level',
    logs_source: 'logs_source',
    logs_id: 'logs_id',
}

// Result of the bank connection flow (Enable Banking), set by /api/bank/callback
export const bankConnectionResultParser = parseAsStringLiteral(['connected', 'error'] as const)

// Logs page: range and search are fetched on the server, level/source/id filter on the client
export const logsLevelParser = parseAsArrayOf(parseAsStringLiteral(Object.values(LogLevel)))

export const logsSourceParser = parseAsString

export const logsIdParser = parseAsString

const paramsParsers = {
    hide_prices: parseAsBoolean.withDefault(false),
    filter_asset: parseAsString.withDefault('all'),
    filter_year: parseAsInteger.withDefault(new Date().getFullYear()),
    bank: bankConnectionResultParser,
    logs_range: parseAsStringLiteral(LOG_RANGES).withDefault(DEFAULT_LOG_RANGE),
    logs_search: parseAsString.withDefault(''),
    logs_level: logsLevelParser.withDefault([]),
    logs_source: logsSourceParser,
    logs_id: logsIdParser,
} as const

export const searchParamsCache = createSearchParamsCache(paramsParsers)
