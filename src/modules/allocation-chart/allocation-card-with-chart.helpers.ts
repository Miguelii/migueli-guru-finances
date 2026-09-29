import type { DonutChartItem } from '@/components/ui/donut-chart'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import { computeTypeBreakdown } from '@/lib/portfolio/calculations'
import type { HoldingSummary } from '@/types/Holding'
import { FALLBACK_ASSET_COLOR } from '@/modules/allocation-chart/allocation-card-with-chart.constants'

/**
 * Builds the donut data of the portfolio current value per asset, largest first.
 * Closed positions (no current value) are left out.
 *
 * @param holdings - All holding summaries.
 */
export function buildAssetAllocation(holdings: HoldingSummary[]): DonutChartItem[] {
    const open = holdings.filter((h) => h.current_value_eur > 0)
    const total = open.reduce((sum, h) => sum + h.current_value_eur, 0)

    return open
        .map((h) => ({
            name: h.symbol,
            value: h.current_value_eur,
            percentage: total > 0 ? (h.current_value_eur / total) * 100 : 0,
            fill: h.tickerHexColor ?? FALLBACK_ASSET_COLOR,
        }))
        .toSorted((a, b) => b.value - a.value)
}

/**
 * Builds the donut data of the portfolio current value per asset type, largest first.
 *
 * @param holdings - All holding summaries.
 */
export function buildTypeAllocation(holdings: HoldingSummary[]): DonutChartItem[] {
    return computeTypeBreakdown(holdings).map((item) => ({
        name: ASSET_TYPE_META[item.type].label,
        value: item.currentValue,
        percentage: item.share,
        fill: ASSET_TYPE_META[item.type].color,
    }))
}
