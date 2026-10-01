import type { ChartConfig } from '@/components/ui/chart'
import type { MonthlyPurchasesEur } from '@/lib/portfolio/transactions-summary'
import type { Ticker, TickerData } from '@/types/Transaction'
import { FALLBACK_ASSET_COLOR } from '@/lib/constants/asset-types'
import { MONTH_LABELS } from '@/modules/monthly-purchases/monthly-purchases-card.constants'

export type MonthlyChartSeries = {
    key: string
    ticker: Ticker
    color: string
}

export type MonthlyChartPoint = { label: string } & Record<string, number | string>

/**
 * Chart-safe series key for a ticker: tickers like `EUR=X` are not valid in the
 * `--color-<key>` CSS variables the chart container generates.
 * @param ticker - Asset ticker.
 */
function toSeriesKey(ticker: Ticker): string {
    return `asset_${ticker.replaceAll(/[^a-zA-Z0-9]/gu, '_')}`
}

export function buildChartSeries(
    purchases: MonthlyPurchasesEur,
    tickerMap: Map<Ticker, TickerData>
): MonthlyChartSeries[] {
    return purchases.assets.map(({ ticker }) => ({
        key: toSeriesKey(ticker),
        ticker,
        color: tickerMap.get(ticker)?.hex_color ?? FALLBACK_ASSET_COLOR,
    }))
}

export function buildChartConfig(series: MonthlyChartSeries[]): ChartConfig {
    return Object.fromEntries(
        series.map(({ key, ticker, color }) => [key, { label: ticker, color }])
    )
}

/**
 * One point per month with each asset's purchases rounded to whole euros (the tooltip
 * prints raw numbers).
 * @param purchases - Result of `aggregateMonthlyPurchasesEur`.
 * @param series - Chart series (one per asset).
 */
export function buildChartData(
    purchases: MonthlyPurchasesEur,
    series: MonthlyChartSeries[]
): MonthlyChartPoint[] {
    return purchases.months.map((bucket) => {
        const point: MonthlyChartPoint = { label: MONTH_LABELS[bucket.month]! }

        for (const { key, ticker } of series) {
            point[key] = Math.round(bucket[ticker] ?? 0)
        }

        return point
    })
}

export function buildYears(firstYear: number, currentYear: number): number[] {
    return Array.from({ length: currentYear - firstYear + 1 }, (_, index) => firstYear + index)
}
