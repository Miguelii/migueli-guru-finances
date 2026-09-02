import type { CambioRates, Ticker, TickerData, Transaction } from '@/types/Transaction'
import { Currency, TransactionType } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'
import { toEur } from '@/lib/utils'
import { processTransactions } from '@/lib/fifo'

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
 * Builds a single {@link HoldingSummary} from a ticker's transactions and market data.
 * Asset-currency metrics come straight from the FIFO pass; EUR metrics use the
 * historical rate per transaction for costs and the current rate for market value.
 *
 * @param tickerId - The ticker identifier.
 * @param txs - All transactions for this ticker.
 * @param td - Ticker metadata and current price (may be `undefined` if missing).
 * @param rates - Current exchange rates.
 */
function buildHolding(
    tickerId: Ticker,
    txs: Transaction[],
    td: TickerData | undefined,
    rates: CambioRates
): HoldingSummary {
    const currency = td?.currency ?? Currency.EUR

    const {
        totalQuantity,
        totalInvested,
        totalInvestedEur,
        avgCost,
        realizedGl,
        realizedGlEur,
        realizedCostBasis,
        buyFees,
        totalSellFees,
        otherFees,
        totalFeesEur,
    } = processTransactions(txs, currency, rates)

    const totalFees = buyFees + totalSellFees + otherFees

    const currentPrice = td?.curr_price ?? 0
    const currentValue = totalQuantity * currentPrice
    const currentValueEur = toEur(currentValue, currency, rates)

    const unrealizedGl = currentValue - totalInvested
    const unrealizedGlWithFees = currentValue - totalInvested - totalFees
    const unrealizedGlPct = pct(unrealizedGl, totalInvested)
    const unrealizedGlWithFeesPct = pct(unrealizedGlWithFees, totalInvested + totalFees)

    const totalGl = realizedGl + unrealizedGl
    const totalCostBasis = totalInvested + realizedCostBasis
    const totalGlWithFees = totalGl - totalFees
    const totalCostBasisWithFees = totalCostBasis + totalFees

    const unrealizedGlEur = currentValueEur - totalInvestedEur
    const unrealizedGlWithFeesEur = currentValueEur - totalInvestedEur - totalFeesEur

    return {
        ticker_id: tickerId,
        symbol: tickerId,
        tickerLogo: td?.logo,
        tickerHexColor: td?.hex_color,
        currency,
        tickerType: td?.type as TickerData['type'],
        total_quantity: totalQuantity,
        total_invested: totalInvested,
        total_fees: totalFees,
        current_price: currentPrice,
        current_value: currentValue,
        avg_cost_per_share: avgCost,
        realized_gl: realizedGl,
        unrealized_gl: unrealizedGl,
        unrealized_gl_pct: unrealizedGlPct,
        unrealized_gl_with_fees: unrealizedGlWithFees,
        unrealized_gl_with_fees_pct: unrealizedGlWithFeesPct,
        total_gl: totalGl,
        total_gl_pct: pct(totalGl, totalCostBasis),
        total_gl_with_fees: totalGlWithFees,
        total_gl_with_fees_pct: pct(totalGlWithFees, totalCostBasisWithFees),
        current_value_eur: currentValueEur,
        total_invested_eur: totalInvestedEur,
        total_fees_eur: totalFeesEur,
        realized_gl_eur: realizedGlEur,
        unrealized_gl_eur: unrealizedGlEur,
        unrealized_gl_eur_pct: pct(unrealizedGlEur, totalInvestedEur),
        unrealized_gl_with_fees_eur: unrealizedGlWithFeesEur,
        unrealized_gl_with_fees_eur_pct: pct(
            unrealizedGlWithFeesEur,
            totalInvestedEur + totalFeesEur
        ),
        total_gl_eur: realizedGlEur + unrealizedGlEur,
    }
}

/**
 * Groups transactions by ticker and computes aggregated holding metrics.
 * Realized G/L uses FIFO (chronological lots, oldest sold first), so a later buy
 * never changes the realized G/L of an earlier sell; REWARDs enter as zero-cost lots.
 * `avg_cost_per_share` is the weighted average cost of the remaining (unsold) lots.
 * This is the single EUR-conversion point: `_eur` fields convert costs at each
 * transaction's historical `exchange_rate` (falling back to the current rate) and
 * market value at the current rate — UI components consume them as-is.
 *
 * @param transactions - All portfolio transactions (any order — sorted internally).
 * @param tickerData - Ticker metadata with current prices.
 * @param rates - Current exchange rates.
 */
export function aggregateHoldings(
    transactions: Transaction[],
    tickerData: TickerData[],
    rates: CambioRates
): HoldingSummary[] {
    const tickerDataMap = new Map<Ticker, TickerData>(tickerData.map((td) => [td.ticker, td]))
    const grouped = groupByTicker(transactions)

    const holdings: HoldingSummary[] = []

    for (const [tickerId, txs] of grouped) {
        holdings.push(buildHolding(tickerId, txs, tickerDataMap.get(tickerId), rates))
    }

    return holdings.toSorted((a, b) => a.ticker_id.localeCompare(b.ticker_id))
}

export type MonthlyPurchasesRow = {
    ticker_id: Ticker
    currency: Currency
    /** Amount spent on BUYs per month in the asset's currency (index 0 = January). */
    monthly: number[]
    total: number
    avg: number
}

export type MonthlyPurchasesTotal = {
    currency: Currency
    monthly: number[]
}

export function aggregateMonthlyPurchasesTotals(
    rows: MonthlyPurchasesRow[],
    rates: CambioRates
): MonthlyPurchasesTotal[] {
    const totalsByCurrency = new Map<Currency, number[]>()

    for (const row of rows) {
        const currency = row.currency !== Currency.EUR ? Currency.EUR : row.currency

        let monthly = totalsByCurrency.get(currency)
        if (!monthly) {
            monthly = Array.from({ length: 12 }, () => 0)
            totalsByCurrency.set(currency, monthly)
        }

        for (const [month, value] of row.monthly.entries()) {
            monthly[month]! += toEur(value, row.currency, rates)
        }
    }

    return Array.from(totalsByCurrency, ([currency, monthly]) => ({ currency, monthly }))
}

/**
 * Aggregates the amount spent on BUY transactions per asset per month for a given
 * year, in each asset's own currency (no EUR conversion). Only assets with at least
 * one BUY in the year are returned, sorted by ticker.
 *
 * @param transactions - All portfolio transactions.
 * @param tickerData - Ticker metadata (used to resolve each asset's currency).
 * @param year - Calendar year to aggregate.
 */
export function aggregateMonthlyPurchases(
    transactions: Transaction[],
    tickerData: TickerData[],
    year: number
): MonthlyPurchasesRow[] {
    const currencyMap = new Map<Ticker, Currency>(tickerData.map((td) => [td.ticker, td.currency]))
    const monthlyByTicker = new Map<Ticker, number[]>()

    for (const tx of transactions) {
        if (tx.type !== TransactionType.Buy || tx.value == null) continue

        const date = new Date(tx.buy_date.replace(' ', 'T'))
        if (date.getFullYear() !== year) continue

        let monthly = monthlyByTicker.get(tx.ticker_id)
        if (!monthly) {
            monthly = Array.from({ length: 12 }, () => 0)
            monthlyByTicker.set(tx.ticker_id, monthly)
        }
        monthly[date.getMonth()]! += tx.value
    }

    const rows: MonthlyPurchasesRow[] = []

    for (const [tickerId, monthly] of monthlyByTicker) {
        const total = monthly.reduce((sum, v) => sum + v, 0)
        rows.push({
            ticker_id: tickerId,
            currency: currencyMap.get(tickerId) ?? Currency.EUR,
            monthly,
            total,
            avg: total / 12,
        })
    }

    return rows.toSorted((a, b) => a.ticker_id.localeCompare(b.ticker_id))
}

type PortfolioTotals = {
    totalInvested: number
    currentValue: number
    unrealizedGl: number
    unrealizedGlPct: number
    totalRealized: number
}

/**
 * Computes portfolio totals in EUR from the holdings' precomputed `_eur` fields.
 * `unrealizedGl` excludes realized gains — realized is reported separately.
 *
 * @param holdings - Array of holding summaries to aggregate.
 */
export function computePortfolioTotals(holdings: HoldingSummary[]): PortfolioTotals {
    const totalInvested = holdings.reduce((sum, h) => sum + h.total_invested_eur, 0)

    const totalRealized = holdings.reduce((sum, h) => sum + h.realized_gl_eur, 0)

    const currentValue = holdings.reduce((sum, h) => sum + h.current_value_eur, 0)

    const unrealizedGl = currentValue - totalInvested

    return {
        totalInvested,
        currentValue,
        unrealizedGl,
        unrealizedGlPct: pct(unrealizedGl, totalInvested),
        totalRealized,
    }
}
