import {
    createSearchParamsCache,
    parseAsBoolean,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    type UrlKeys,
} from 'nuqs/server'

export const paramsUrlKeys: UrlKeys<typeof paramsParsers> = {
    hide_prices: 'hide_prices',
    filter_asset: 'filter_asset',
    filter_year: 'filter_year',
    bank: 'bank',
}

// Result of the bank connection flow (Enable Banking), set by /api/bank/callback
export const bankConnectionResultParser = parseAsStringLiteral(['connected', 'error'] as const)

const paramsParsers = {
    hide_prices: parseAsBoolean.withDefault(false),
    filter_asset: parseAsString.withDefault('all'),
    filter_year: parseAsInteger.withDefault(new Date().getFullYear()),
    bank: bankConnectionResultParser,
} as const

export const searchParamsCache = createSearchParamsCache(paramsParsers)
