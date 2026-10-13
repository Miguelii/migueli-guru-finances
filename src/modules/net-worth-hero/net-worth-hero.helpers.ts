import { Currency } from '@/types/Transaction'
import { formatCurrency, formatMonthLong } from '@/lib/portfolio/formaters'
import type { InvestedTimelinePoint } from '@/lib/portfolio/invested-timeline'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'

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

/**
 * Swaps the current month's stored month-end point (the latest day the cron recorded)
 * for the live totals, so the value chart always ends at the same numbers as the hero.
 *
 * @param snapshots - Stored month-end snapshots, oldest first.
 * @param live - Today's totals computed from the current holdings.
 */
export function withLiveSnapshot(
    snapshots: PortfolioSnapshotPoint[],
    live: PortfolioSnapshotPoint
): PortfolioSnapshotPoint[] {
    const liveMonth = live.date.slice(0, 7)

    return [...snapshots.filter((snapshot) => snapshot.date.slice(0, 7) < liveMonth), live]
}
