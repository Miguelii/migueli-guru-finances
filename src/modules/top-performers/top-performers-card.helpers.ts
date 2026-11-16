import type { HoldingSummary } from '@/types/Holding'
import { TickerType } from '@/types/core/TickerType'

type TopMoverHolding = Pick<
    HoldingSummary,
    'tickerType' | 'total_quantity' | 'unrealized_gl_eur_pct'
>

type TopMovers<T extends TopMoverHolding> = {
    best: T[]
    worst: T[]
}

/**
 * Splits the open positions into the best and worst performers by unrealized EUR
 * G/L %. FX holdings and closed positions are ignored, and a position never shows
 * up in both lists (with fewer than `2 * count` positions the worst list is shorter).
 *
 * @param holdings - All holding summaries.
 * @param count - Maximum number of positions per list.
 */
export function getTopMovers<T extends TopMoverHolding>(
    holdings: T[],
    count: number
): TopMovers<T> {
    const ranked = holdings
        .filter((h) => h.tickerType !== TickerType.Cambio && h.total_quantity > 0)
        .toSorted((a, b) => b.unrealized_gl_eur_pct - a.unrealized_gl_eur_pct)

    const best = ranked.slice(0, count)
    const worst = ranked.slice(best.length).toReversed().slice(0, count)

    return { best, worst }
}
