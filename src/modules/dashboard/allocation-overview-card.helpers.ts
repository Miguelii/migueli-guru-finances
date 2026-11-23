import { FALLBACK_ASSET_COLOR } from '@/lib/constants/asset-types'
import { computeTypeBreakdown } from '@/lib/portfolio/calculations'
import type { HoldingSummary } from '@/types/Holding'
import type { TickerType } from '@/types/core/TickerType'
import { OTHER_ASSETS_LABEL } from '@/modules/dashboard/allocation-overview-card.constants'

type AssetHolding = Pick<
    HoldingSummary,
    | 'ticker_id'
    | 'symbol'
    | 'tickerLogo'
    | 'tickerHexColor'
    | 'current_value_eur'
    | 'total_invested_eur'
>

export type TypeAllocationRow = {
    type: TickerType
    valueEur: number
    /** Share of the portfolio current value, in percent */
    share: number
    unrealizedGlPct: number
}

export type AssetAllocationRow = {
    id: string
    label: string
    logo: HoldingSummary['tickerLogo'] | null
    color: string
    valueEur: number
    /** Share of the portfolio current value, in percent */
    share: number
    unrealizedGlPct: number
}

function pct(numerator: number, denominator: number): number {
    return denominator !== 0 ? (numerator / denominator) * 100 : 0
}

/**
 * Allocation rows per asset type, largest first (types without value are left out).
 *
 * @param holdings - All holding summaries.
 */
export function buildTypeAllocationRows(
    holdings: Parameters<typeof computeTypeBreakdown>[0]
): TypeAllocationRow[] {
    return computeTypeBreakdown(holdings).map((item) => ({
        type: item.type,
        valueEur: item.currentValue,
        share: item.share,
        unrealizedGlPct: item.totals.unrealizedGlPct,
    }))
}

/**
 * Allocation rows of the `limit` largest open positions, plus one "Others" row that
 * groups the remaining positions when there are more.
 *
 * @param holdings - All holding summaries (closed positions are ignored).
 * @param limit - Positions listed one by one.
 */
export function buildAssetAllocationRows(
    holdings: AssetHolding[],
    limit: number
): AssetAllocationRow[] {
    const open = holdings
        .filter((h) => h.current_value_eur > 0)
        .toSorted((a, b) => b.current_value_eur - a.current_value_eur)
    const total = open.reduce((sum, h) => sum + h.current_value_eur, 0)

    const rows: AssetAllocationRow[] = open.slice(0, limit).map((h) => ({
        id: h.ticker_id,
        label: h.symbol,
        logo: h.tickerLogo ?? null,
        color: h.tickerHexColor ?? FALLBACK_ASSET_COLOR,
        valueEur: h.current_value_eur,
        share: pct(h.current_value_eur, total),
        unrealizedGlPct: pct(h.current_value_eur - h.total_invested_eur, h.total_invested_eur),
    }))

    const rest = open.slice(limit)
    if (rest.length === 0) return rows

    const restValue = rest.reduce((sum, h) => sum + h.current_value_eur, 0)
    const restInvested = rest.reduce((sum, h) => sum + h.total_invested_eur, 0)

    return [
        ...rows,
        {
            id: OTHER_ASSETS_LABEL,
            label: `${OTHER_ASSETS_LABEL} (${rest.length})`,
            logo: null,
            color: FALLBACK_ASSET_COLOR,
            valueEur: restValue,
            share: pct(restValue, total),
            unrealizedGlPct: pct(restValue - restInvested, restInvested),
        },
    ]
}
