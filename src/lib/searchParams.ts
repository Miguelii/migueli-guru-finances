import { createSearchParamsCache, parseAsBoolean, parseAsString, type UrlKeys } from 'nuqs/server'

export const paramsUrlKeys: UrlKeys<typeof paramsParsers> = {
    hide_prices: 'hide_prices',
    filter_asset: 'filter_asset',
}

const paramsParsers = {
    hide_prices: parseAsBoolean.withDefault(false),
    filter_asset: parseAsString.withDefault('all'),
} as const

export const searchParamsCache = createSearchParamsCache(paramsParsers)
