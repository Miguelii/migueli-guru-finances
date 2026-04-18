import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Currency, Ticker, type CambioRates, type TickerData } from '@/types/Transaction'

/**
 * Merges Tailwind CSS classes with `clsx` and `tailwind-merge`,
 * @param inputs - Class values (strings, objects, arrays) to merge.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Returns the build timestamp used for cache-busting.
 * Falls back to `'1'` in local development.
 * @public
 */
export const getBuildId = () => {
    return process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? '1'
}

/**
 * Finds the most recently updated ticker and returns its `last_updated_at` timestamp.
 * Returns `'—'` when the data array is empty.
 * @param data - Array of ticker data entries.
 */
export function getLatestUpdate(data: TickerData[]): string {
    if (data.length === 0) return '—'
    const latest = data.reduce((a, b) => (a.last_updated_at > b.last_updated_at ? a : b), data[0])
    const split = latest.last_updated_at.split('T')
    if (split?.length === 1) return split.at(0)!
    return `${split.at(0)} ${split.at(1)}`
}

/**
 * Converts a value to EUR using the appropriate exchange rate.
 * Returns the value unchanged if already in EUR.
 * @param value - The numeric value to convert.
 * @param currency - The currency of the value.
 * @param rates - The exchange rates for conversion.
 */
export function toEur(value: number, currency: TickerData['currency'], rates: CambioRates): number {
    if (currency === Currency.USD) return value * rates.usdToEur
    if (currency === Currency.USDC) return value * rates.usdcToEur
    return value
}

/**
 * Groups ticker data by asset type in a single pass, preserving original order within each group.
 * @param items - Array of ticker data to group
 */
export function groupAssetsByType(items: TickerData[]): Map<TickerData['type'], TickerData[]> {
    const groups = new Map<TickerData['type'], TickerData[]>()

    for (const tick of items) {
        const existing = groups.get(tick.type)
        if (existing) {
            existing.push(tick)
        } else {
            groups.set(tick.type, [tick])
        }
    }

    return groups
}

/**
 * Extracts EUR exchange rates for USD and USDC from a list of ticker data.
 *
 * @param data - List of ticker data to search for exchange rates
 * @returns Object containing the EUR rates for USD and USDC
 */
export function getCambioRates(data: TickerData[]): CambioRates {
    const rates: CambioRates = { usdToEur: 0, usdcToEur: 0 }

    for (const { curr_price, ticker } of data) {
        if (ticker === Ticker.USD_EUR) rates.usdToEur = curr_price ?? 0
        if (ticker === Ticker.USDC_EUR) rates.usdcToEur = curr_price ?? 0
    }

    return rates
}
