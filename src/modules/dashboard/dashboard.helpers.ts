import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'

/**
 * Swaps the current month's stored month-end point (the latest day the cron recorded)
 * for the live totals, so the value chart always ends at the same numbers as the KPIs.
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
