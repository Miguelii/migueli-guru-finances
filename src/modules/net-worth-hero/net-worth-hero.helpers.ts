import { Currency } from '@/types/Transaction'
import { formatCurrency } from '@/lib/portfolio/formaters'
import type { InvestedTimelinePoint } from '@/lib/portfolio/invested-timeline'

const compactEurFormatter = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: Currency.EUR,
    notation: 'compact',
    maximumFractionDigits: 1,
})

/**
 * Parses a `YYYY-MM` month key into a local `Date` on the first day of that month.
 *
 * @param monthKey - Month key in `YYYY-MM` format.
 */
function parseMonthKey(monthKey: string): Date {
    const [year, month] = monthKey.split('-').map(Number)
    return new Date(year ?? 0, (month ?? 1) - 1, 1)
}

/**
 * Formats a `YYYY-MM` month key as a short axis tick (e.g. `jan. 25`).
 *
 * @param monthKey - Month key in `YYYY-MM` format.
 */
export function formatMonthTick(monthKey: string): string {
    return parseMonthKey(monthKey).toLocaleDateString('pt-PT', {
        month: 'short',
        year: '2-digit',
    })
}

/**
 * Formats a `YYYY-MM` month key for tooltips and summaries (e.g. `janeiro de 2025`).
 *
 * @param monthKey - Month key in `YYYY-MM` format.
 */
export function formatMonthLong(monthKey: string): string {
    return parseMonthKey(monthKey).toLocaleDateString('pt-PT', {
        month: 'long',
        year: 'numeric',
    })
}

/**
 * Formats a EUR amount in compact notation for axis ticks (e.g. `12,5 mil €`).
 *
 * @param value - Amount in EUR.
 */
export function formatCompactEur(value: number): string {
    return compactEurFormatter.format(value)
}

/**
 * Builds the screen reader summary of the invested capital chart.
 *
 * @param points - Monthly invested capital points (oldest first).
 * @param currentValue - Current portfolio value in EUR.
 * @param hidePrices - When true, amounts are left out of the summary.
 */
export function getInvestedChartSummary(
    points: InvestedTimelinePoint[],
    currentValue: number,
    hidePrices: boolean
): string {
    const first = points.at(0)
    const last = points.at(-1)
    if (!first || !last) return 'No invested capital history yet'

    const since = formatMonthLong(first.month)
    if (hidePrices) return `Invested capital over time since ${since}`

    return `Invested capital grew to ${formatCurrency(last.investedEur, Currency.EUR)} since ${since}, current value ${formatCurrency(currentValue, Currency.EUR)}`
}
