import type { InvestedTimelinePoint } from '@/lib/portfolio/invested-timeline'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import { KPI_SPARKLINE_POINTS } from '@/modules/dashboard/kpi-card.constants'

/**
 * Change in % of the portfolio value from the previous month-end to the latest point,
 * or `null` without two points (or when the previous value is zero).
 *
 * @param points - Month-end value points, oldest first (the last one is live).
 */
export function getMonthOverMonthChange(points: PortfolioSnapshotPoint[]): number | null {
    const previous = points.at(-2)
    const latest = points.at(-1)
    if (!previous || !latest || previous.valueEur === 0) return null

    return ((latest.valueEur - previous.valueEur) / previous.valueEur) * 100
}

/**
 * Change of the invested capital (cost basis of the open lots) during the current month:
 * new purchases minus the cost of what was sold.
 *
 * @param points - Monthly invested capital points, oldest first.
 */
export function getMonthlyInvestedChange(points: InvestedTimelinePoint[]): number {
    const latest = points.at(-1)
    if (!latest) return 0

    return latest.investedEur - (points.at(-2)?.investedEur ?? 0)
}

/**
 * Last values of a series for a KPI sparkline.
 *
 * @param values - Full series, oldest first.
 */
export function toSparkline(values: number[]): number[] {
    return values.slice(-KPI_SPARKLINE_POINTS)
}
