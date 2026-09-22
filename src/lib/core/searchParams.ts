import {
    createSearchParamsCache,
    parseAsBoolean,
    parseAsInteger,
    parseAsString,
    type UrlKeys,
} from 'nuqs/server'

export const paramsUrlKeys: UrlKeys<typeof paramsParsers> = {
    hide_prices: 'hide_prices',
    filter_asset: 'filter_asset',
    filter_year: 'filter_year',
}

const paramsParsers = {
    hide_prices: parseAsBoolean.withDefault(false),
    filter_asset: parseAsString.withDefault('all'),
    filter_year: parseAsInteger.withDefault(new Date().getFullYear()),
} as const

export const searchParamsCache = createSearchParamsCache(paramsParsers)
