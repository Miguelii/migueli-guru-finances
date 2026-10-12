import { formatCurrency } from '@/lib/portfolio/formaters'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import { Currency } from '@/types/Transaction'
import { formatMonthLong } from '@/modules/net-worth-hero/net-worth-hero.helpers'
import {
    VALUE_RANGE_MONTHS,
    ValueRange,
} from '@/modules/net-worth-hero/value-timeline-chart.constants'

/**
 * Parses a `YYYY-MM-DD` day key into a local `Date` at midnight of that day.
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 */
function parseDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

/**
 * Formats a local date back into a `YYYY-MM-DD` day key.
 *
 * @param date - Local date.
 */
function toLocalDateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Returns the first day (inclusive) a range covers, counted back from `latest`, or
 * `null` for the whole history.
 *
 * @param range - Selected range.
 * @param latest - Day key of the most recent point.
 */
export function getRangeStart(range: ValueRange, latest: string): string | null {
    if (range === ValueRange.All) return null
    if (range === ValueRange.YearToDate) return `${latest.slice(0, 4)}-01-01`

    const months = VALUE_RANGE_MONTHS[range] ?? 0
    const start = parseDateKey(latest)
    start.setMonth(start.getMonth() - months)

    return toLocalDateKey(start)
}

/**
 * Keeps the points inside a range plus the last one before it, so the series starts
 * from the month-end the period is measured against (YTD starts at December's close).
 *
 * @param points - Month-end snapshots, oldest first.
 * @param range - Selected range.
 */
export function filterPointsByRange(
    points: PortfolioSnapshotPoint[],
    range: ValueRange
): PortfolioSnapshotPoint[] {
    const latest = points.at(-1)
    if (!latest) return []

    const start = getRangeStart(range, latest.date)
    if (start === null) return points

    const firstInRange = points.findIndex((point) => point.date >= start)

    return points.slice(Math.max(0, firstInRange - 1))
}

/**
 * Total gain of a snapshot: unrealized (value minus open cost basis) plus realized.
 *
 * @param point - A month-end snapshot.
 */
function getTotalGain(point: PortfolioSnapshotPoint): number {
    return point.valueEur - point.investedEur + point.realizedGlEur
}

/**
 * Gain earned between the first and last point of a series, net of the money put in or
 * taken out (deposits move value and invested capital alike, so they cancel out).
 * Returns `null` with fewer than two points.
 *
 * @param points - Month-end snapshots, oldest first.
 */
export function getPeriodGain(points: PortfolioSnapshotPoint[]): number | null {
    const first = points.at(0)
    const last = points.at(-1)
    if (!first || !last || points.length < 2) return null

    return getTotalGain(last) - getTotalGain(first)
}

/**
 * Builds the screen reader summary of the value chart.
 *
 * @param points - The points on the chart, oldest first.
 * @param hidePrices - When true, amounts are left out of the summary.
 */
export function getValueChartSummary(
    points: PortfolioSnapshotPoint[],
    hidePrices: boolean
): string {
    const first = points.at(0)
    const last = points.at(-1)
    if (!first || !last) return 'No portfolio value history yet'

    const since = formatMonthLong(first.date)
    if (hidePrices) return `Portfolio value against invested capital since ${since}`

    return `Portfolio value went from ${formatCurrency(first.valueEur, Currency.EUR)} to ${formatCurrency(last.valueEur, Currency.EUR)} since ${since}, with ${formatCurrency(last.investedEur, Currency.EUR)} invested`
}
