import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import { ALL_POSITION_TYPES, type PositionSortKey } from '@/lib/constants/positions'
import { computePortfolioTotals, type PortfolioTotals } from '@/lib/portfolio/calculations'
import type { HoldingSummary } from '@/types/Holding'
import type { TickerType } from '@/types/Transaction'

export type PositionTypeFilter = typeof ALL_POSITION_TYPES | TickerType

export type PositionsTotals = PortfolioTotals & {
    totalFees: number
    count: number
}

export type UnrealizedGl = {
    value: number
    pct: number
}

export function splitPositions(holdings: HoldingSummary[]) {
    return {
        open: holdings.filter((h) => h.total_quantity > 0),
        closed: holdings.filter((h) => h.total_quantity <= 0),
    }
}

export function filterPositionsByType(
    positions: HoldingSummary[],
    type: PositionTypeFilter
): HoldingSummary[] {
    return type === ALL_POSITION_TYPES ? positions : positions.filter((h) => h.tickerType === type)
}

/**
 * Asset types present in the positions, in the `ASSET_TYPE_META` order (tabs only show
 * types the user actually holds).
 * @param positions - Open positions.
 */
export function getAvailableTypes(positions: HoldingSummary[]): TickerType[] {
    const present = new Set(positions.map((h) => h.tickerType))

    return (Object.keys(ASSET_TYPE_META) as TickerType[]).filter((type) => present.has(type))
}

/**
 * Unrealized EUR G/L of a position, before or after fees.
 * @param holding - Position summary.
 * @param includeFees - Use the `_with_fees` metrics.
 */
export function getUnrealized(holding: HoldingSummary, includeFees: boolean): UnrealizedGl {
    return includeFees
        ? {
              value: holding.unrealized_gl_with_fees_eur,
              pct: holding.unrealized_gl_with_fees_eur_pct,
          }
        : { value: holding.unrealized_gl_eur, pct: holding.unrealized_gl_eur_pct }
}

/**
 * Sorts positions by the chosen key: numeric keys descending, `name` ascending.
 * The unrealized sort follows the fees toggle.
 * @param positions - Positions to sort (not mutated).
 * @param sortKey - Sort key from the URL.
 * @param includeFees - Whether unrealized G/L includes fees.
 */
export function sortPositions(
    positions: HoldingSummary[],
    sortKey: PositionSortKey,
    includeFees: boolean
): HoldingSummary[] {
    const metric: Record<Exclude<PositionSortKey, 'name'>, (h: HoldingSummary) => number> = {
        value: (h) => h.current_value_eur,
        unrealized: (h) => getUnrealized(h, includeFees).pct,
        total_gl: (h) => h.total_gl_eur,
    }

    if (sortKey === 'name') {
        return positions.toSorted((a, b) => a.symbol.localeCompare(b.symbol))
    }

    return positions.toSorted((a, b) => metric[sortKey](b) - metric[sortKey](a))
}

/**
 * Share of a position in the total market value, in percent (0 when the total is 0).
 * @param holding - Position summary.
 * @param totalValueEur - Market value of all open positions.
 */
export function getPositionWeight(holding: HoldingSummary, totalValueEur: number): number {
    return totalValueEur > 0 ? (holding.current_value_eur / totalValueEur) * 100 : 0
}

/**
 * EUR totals of every holding (closed ones still add realized G/L and fees), plus the
 * number of open positions.
 * @param holdings - All holding summaries.
 */
export function getPositionsTotals(holdings: HoldingSummary[]): PositionsTotals {
    return {
        ...computePortfolioTotals(holdings),
        totalFees: holdings.reduce((sum, h) => sum + h.total_fees_eur, 0),
        count: holdings.filter((h) => h.total_quantity > 0).length,
    }
}
