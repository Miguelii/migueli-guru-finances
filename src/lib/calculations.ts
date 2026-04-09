import type { CambioRates, Ticker, TickerData, Transaction } from '@/types/Transaction'
import { Currency, TransactionType } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'
import { toEur } from '@/lib/utils'

type CostBasis = {
    totalQuantity: number
    totalInvested: number
    totalFees: number
    avgCost: number
}

type RealizedMetrics = {
    totalQuantity: number
    totalInvested: number
    realizedGl: number
    realizedCostBasis: number
}

/**
 * Computes the safe percentage ratio, returning `0` when the denominator is zero.
 *
 * @param numerator - The dividend value.
 * @param denominator - The divisor value.
 */
function pct(numerator: number, denominator: number): number {
    return denominator !== 0 ? (numerator / denominator) * 100 : 0
}

/**
 * Groups an array of transactions by `ticker_id`.
 *
 * @param transactions - Flat array of all transactions.
 */
function groupByTicker(transactions: Transaction[]): Map<Ticker, Transaction[]> {
    const grouped = new Map<Ticker, Transaction[]>()

    for (const tx of transactions) {
        const existing = grouped.get(tx.ticker_id)
        if (existing) {
            existing.push(tx)
        } else {
            grouped.set(tx.ticker_id, [tx])
        }
    }

    return grouped
}

/**
 * First pass over transactions: accumulates BUY/REWARD quantities,
 * invested totals, and fees to build the cost basis.
 *
 * @param txs - Transactions for a single ticker.
 */
function buildCostBasis(txs: Transaction[]): CostBasis {
    let totalQuantity = 0
    let totalInvested = 0
    let totalFees = 0

    for (const tx of txs) {
        if (tx.type === TransactionType.Buy) {
            totalQuantity += tx.quantity ?? 0
            totalInvested += tx.value ?? 0
        } else if (tx.type === TransactionType.Reward) {
            totalQuantity += tx.quantity ?? 0
        }
        totalFees += tx.fee
    }

    const avgCost = totalQuantity > 0 ? totalInvested / totalQuantity : 0

    return { totalQuantity, totalInvested, totalFees, avgCost }
}

/**
 * Second pass over transactions: processes SELL operations using the
 * weighted average cost to compute realized gains/losses.
 *
 * @param txs - Transactions for a single ticker.
 * @param basis - The cost basis computed from the first pass.
 */
function applysells(txs: Transaction[], basis: CostBasis): RealizedMetrics {
    let { totalQuantity, totalInvested } = basis
    let realizedGl = 0
    let realizedCostBasis = 0

    for (const tx of txs) {
        if (tx.type !== TransactionType.Sell) continue

        const costOfSold = basis.avgCost * (tx.quantity ?? 0)
        realizedGl += (tx.value ?? 0) - costOfSold
        realizedCostBasis += costOfSold
        totalQuantity -= tx.quantity ?? 0
        totalInvested -= costOfSold
    }

    return { totalQuantity, totalInvested, realizedGl, realizedCostBasis }
}

/**
 * Builds a single {@link HoldingSummary} from a ticker's transactions and market data.
 *
 * @param tickerId - The ticker identifier.
 * @param txs - All transactions for this ticker.
 * @param td - Ticker metadata and current price (may be `undefined` if missing).
 */
function buildHolding(
    tickerId: Ticker,
    txs: Transaction[],
    td: TickerData | undefined
): HoldingSummary {
    const basis = buildCostBasis(txs)
    const sells = applysells(txs, basis)

    const { totalQuantity, totalInvested, realizedGl, realizedCostBasis } = sells
    const { totalFees } = basis

    const currentPrice = td?.curr_price ?? 0
    const currentValue = totalQuantity * currentPrice
    const avgCostPerShare = totalQuantity > 0 ? totalInvested / totalQuantity : basis.avgCost

    const unrealizedGl = currentValue - totalInvested
    const costBasis = totalInvested + totalFees
    const unrealizedGlWithFees = currentValue - costBasis

    const totalGl = realizedGl + unrealizedGl
    const totalCostBasis = totalInvested + realizedCostBasis
    const totalGlWithFees = totalGl - totalFees
    const totalCostBasisWithFees = totalCostBasis + totalFees

    return {
        ticker_id: tickerId,
        symbol: tickerId,
        tickerLogo: td?.logo,
        tickerHexColor: td?.hex_color,
        currency: td?.currency ?? Currency.EUR,
        tickerType: td?.type as TickerData['type'],
        total_quantity: totalQuantity,
        total_invested: totalInvested,
        total_fees: totalFees,
        current_price: currentPrice,
        current_value: currentValue,
        avg_cost_per_share: avgCostPerShare,
        realized_gl: realizedGl,
        realized_gl_pct: pct(realizedGl, realizedCostBasis),
        unrealized_gl: unrealizedGl,
        unrealized_gl_pct: pct(unrealizedGl, totalInvested),
        unrealized_gl_with_fees: unrealizedGlWithFees,
        unrealized_gl_with_fees_pct: pct(unrealizedGlWithFees, costBasis),
        total_gl: totalGl,
        total_gl_pct: pct(totalGl, totalCostBasis),
        total_gl_with_fees: totalGlWithFees,
        total_gl_with_fees_pct: pct(totalGlWithFees, totalCostBasisWithFees),
    }
}

/**
 * Groups transactions by ticker and computes aggregated holding metrics.
 * Uses weighted average cost (DCA) method — not FIFO/LIFO.
 *
 * @param transactions - All portfolio transactions.
 * @param tickerData - Ticker metadata with current prices.
 */
export function aggregateHoldings(
    transactions: Transaction[],
    tickerData: TickerData[]
): HoldingSummary[] {
    const tickerDataMap = new Map<Ticker, TickerData>(tickerData.map((td) => [td.ticker, td]))
    const grouped = groupByTicker(transactions)

    const holdings: HoldingSummary[] = []

    for (const [tickerId, txs] of grouped) {
        holdings.push(buildHolding(tickerId, txs, tickerDataMap.get(tickerId)))
    }

    return holdings.toSorted((a, b) => a.ticker_id.localeCompare(b.ticker_id))
}

type PortfolioTotals = {
    totalInvested: number
    currentValue: number
    glValue: number
    glPct: number
    totalRealize: number
}

/**
 * Computes portfolio totals (invested, current value, G/L) from holdings,
 * converting all values to EUR using the provided exchange rates.
 *
 * @param holdings - Array of holding summaries to aggregate.
 * @param rates - Exchange rates for currency conversion.
 */
export function computePortfolioTotals(
    holdings: HoldingSummary[],
    rates: CambioRates
): PortfolioTotals {
    const totalInvested = holdings.reduce(
        (sum, h) => sum + toEur(h.total_invested, h.currency, rates),
        0
    )

    const totalRealize = holdings.reduce(
        (sum, h) => sum + toEur(h.realized_gl, h.currency, rates),
        0
    )

    const currentValue = holdings.reduce(
        (sum, h) => sum + toEur(h.current_value, h.currency, rates),
        0
    )

    const netInvested = totalInvested - totalRealize

    const glValue = currentValue - netInvested

    const glPct = netInvested !== 0 ? (glValue / netInvested) * 100 : 0

    return { totalInvested: netInvested, currentValue, glValue, glPct, totalRealize }
}
