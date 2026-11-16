import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import { ALL_POSITION_TYPES, type PositionSortKey } from '@/lib/constants/positions'
import { computePortfolioTotals, type PortfolioTotals } from '@/lib/portfolio/calculations'
import type { HoldingSummary } from '@/types/Holding'
import { TickerType } from '@/types/core/TickerType'

export type PositionTypeFilter = typeof ALL_POSITION_TYPES | TickerType

export type PositionsTotals = PortfolioTotals & {
    totalFees: number
    count: number
}

export type UnrealizedGl = {
    value: number
    pct: number
}

export function splitPositions<T extends Pick<HoldingSummary, 'total_quantity'>>(holdings: T[]) {
    return {
        open: holdings.filter((h) => h.total_quantity > 0),
        closed: holdings.filter((h) => h.total_quantity <= 0),
    }
}

export function filterPositionsByType<T extends Pick<HoldingSummary, 'tickerType'>>(
    positions: T[],
    type: PositionTypeFilter
): T[] {
    return type === ALL_POSITION_TYPES ? positions : positions.filter((h) => h.tickerType === type)
}

/**
 * Asset types present in the positions, in the `ASSET_TYPE_META` order (tabs only show
 * types the user actually holds).
 * @param positions - Open positions.
 */
export function getAvailableTypes(positions: Pick<HoldingSummary, 'tickerType'>[]): TickerType[] {
    const present = new Set(
        positions.flatMap((holding) => (holding.tickerType ? [holding.tickerType] : []))
    )

    return Object.values(TickerType).filter((type) => type in ASSET_TYPE_META && present.has(type))
}

/**
 * Unrealized EUR G/L of a position, before or after fees.
 * @param holding - Position summary.
 * @param includeFees - Use the `_with_fees` metrics.
 */
export function getUnrealized(
    holding: Pick<
        HoldingSummary,
        | 'unrealized_gl_with_fees_eur'
        | 'unrealized_gl_with_fees_eur_pct'
        | 'unrealized_gl_eur'
        | 'unrealized_gl_eur_pct'
    >,
    includeFees: boolean
): UnrealizedGl {
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
export function sortPositions<
    T extends Pick<
        HoldingSummary,
        | 'symbol'
        | 'current_value_eur'
        | 'unrealized_gl_with_fees_eur'
        | 'unrealized_gl_with_fees_eur_pct'
        | 'unrealized_gl_eur'
        | 'unrealized_gl_eur_pct'
        | 'total_gl_eur'
    >,
>(positions: T[], sortKey: PositionSortKey, includeFees: boolean): T[] {
    const metric: Record<Exclude<PositionSortKey, 'name'>, (h: T) => number> = {
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
export function getPositionWeight(
    holding: Pick<HoldingSummary, 'current_value_eur'>,
    totalValueEur: number
): number {
    return totalValueEur > 0 ? (holding.current_value_eur / totalValueEur) * 100 : 0
}

/**
 * EUR totals of every holding (closed ones still add realized G/L and fees), plus the
 * number of open positions.
 * @param holdings - All holding summaries.
 */
export function getPositionsTotals(
    holdings: Pick<
        HoldingSummary,
        | 'total_invested_eur'
        | 'current_value_eur'
        | 'realized_gl_eur'
        | 'total_fees_eur'
        | 'total_quantity'
    >[]
): PositionsTotals {
    return {
        ...computePortfolioTotals(holdings),
        totalFees: holdings.reduce((sum, h) => sum + h.total_fees_eur, 0),
        count: holdings.filter((h) => h.total_quantity > 0).length,
    }
}
