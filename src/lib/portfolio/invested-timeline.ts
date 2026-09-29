import type { CambioRates, TickerData, Transaction } from '@/types/Transaction'
import { aggregateHoldings } from '@/lib/portfolio/calculations'

export type InvestedTimelinePoint = {
    /** Month key in `YYYY-MM` format */
    month: string
    investedEur: number
}

function toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Builds the monthly evolution of the invested capital (FIFO cost basis of the open
 * lots, in EUR) from the month before the first transaction up to `now`. Each point
 * is the cost basis at the end of that month, computed with the same FIFO and
 * historical FX logic as `aggregateHoldings`, so the last point matches the
 * current `total_invested_eur` sum.
 *
 * @param transactions - All portfolio transactions (any order, sorted internally).
 * @param tickerData - Ticker metadata (used to resolve each asset's currency).
 * @param rates - Current exchange rates (fallback when a transaction has no rate).
 * @param now - Reference date for the last point (defaults to the current date).
 */
export function buildInvestedTimeline(
    transactions: Transaction[],
    tickerData: TickerData[],
    rates: CambioRates,
    now: Date = new Date()
): InvestedTimelinePoint[] {
    if (transactions.length === 0) return []

    const dated = transactions
        .map((tx) => ({ tx, time: new Date(tx.buy_date.replace(' ', 'T')).getTime() }))
        .toSorted((a, b) => a.time - b.time)

    const first = new Date(dated[0]!.time)
    const startYear = first.getFullYear()
    const startMonth = first.getMonth() - 1
    const monthCount = (now.getFullYear() - startYear) * 12 + (now.getMonth() - startMonth) + 1

    const points: InvestedTimelinePoint[] = []
    let included = 0

    for (let offset = 0; offset < monthCount; offset++) {
        const monthStart = new Date(startYear, startMonth + offset, 1)
        const nextMonthStart = new Date(startYear, startMonth + offset + 1, 1).getTime()
        while (included < dated.length && dated[included]!.time < nextMonthStart) included++

        const txs = dated.slice(0, included).map(({ tx }) => tx)
        const investedEur = aggregateHoldings(txs, tickerData, rates).reduce(
            (sum, h) => sum + h.total_invested_eur,
            0
        )

        points.push({ month: toMonthKey(monthStart), investedEur })
    }

    return points
}
