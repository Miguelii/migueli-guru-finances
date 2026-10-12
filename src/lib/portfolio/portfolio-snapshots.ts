import type { Ticker, TickerData, Transaction } from '@/types/Transaction'
import { TransactionType } from '@/types/Transaction'
import { aggregateHoldings, computePortfolioTotals } from '@/lib/portfolio/calculations'
import { getCambioRates, toEur } from '@/lib/utils'

export type PortfolioSnapshotPoint = {
    /** Day key in `YYYY-MM-DD` format */
    date: string
    valueEur: number
    investedEur: number
    realizedGlEur: number
}

/** Daily closing prices (asset currency) per ticker, keyed by `YYYY-MM-DD` day */
export type PriceHistory = Map<Ticker, Map<string, number>>

/**
 * Formats a date as a `YYYY-MM-DD` day key in the given time zone.
 *
 * @param date - The instant to format.
 * @param timeZone - IANA time zone that decides the calendar day (e.g. `Europe/Lisbon`).
 */
export function toDateKey(date: Date, timeZone: string): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)
}

/**
 * Shifts a `YYYY-MM-DD` day key by a number of calendar days (negative goes back).
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 * @param days - Number of days to add.
 */
export function addDaysToDateKey(dateKey: string, days: number): string {
    const [year, month, day] = dateKey.split('-').map(Number)
    return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days))
        .toISOString()
        .slice(0, 10)
}

/**
 * Computes the EUR totals of a snapshot from the transactions and the current ticker
 * prices, with the same FIFO and historical FX logic as the dashboard.
 *
 * @param transactions - The user's transactions (any order).
 * @param tickerData - Ticker metadata with current prices (also the source of the FX rates).
 */
export function computeSnapshotTotals(
    transactions: Transaction[],
    tickerData: TickerData[]
): Omit<PortfolioSnapshotPoint, 'date'> {
    const holdings = aggregateHoldings(transactions, tickerData, getCambioRates(tickerData))
    const totals = computePortfolioTotals(holdings)

    return {
        valueEur: totals.currentValue,
        investedEur: totals.totalInvested,
        realizedGlEur: totals.totalRealized,
    }
}

/**
 * Unit price a BUY or SELL was executed at, in the asset currency, or `undefined`
 * when the transaction carries no price (REWARD, FEE, missing quantity).
 *
 * @param tx - The transaction.
 */
function getTransactionUnitPrice(tx: Transaction): number | undefined {
    if (tx.type !== TransactionType.Buy && tx.type !== TransactionType.Sell) return undefined
    if (tx.transaction_price) return tx.transaction_price
    if (tx.value && tx.quantity) return tx.value / tx.quantity
    return undefined
}

/**
 * Rebuilds one snapshot per calendar day, from the day of the first transaction up to
 * `to` (inclusive), valuing each day's holdings at that day's close.
 *
 * Each asset's price is its latest close on or before the day (weekends and holidays
 * carry the previous close forward), then the latest price it was bought or sold at,
 * then its current price. FX rates come from the history of the cambio tickers the
 * same way. Invested capital and realized G/L use the current rates as fallback for
 * transactions without an `exchange_rate`, exactly like `aggregateHoldings` does for
 * the dashboard, so the series joins today's totals without a jump.
 *
 * @param transactions - The user's transactions (any order, sorted internally).
 * @param tickerData - Ticker metadata with current prices.
 * @param priceHistory - Daily closes per ticker (assets and cambio tickers).
 * @param to - Last day to build, `YYYY-MM-DD`.
 */
export function buildHistoricalSnapshots(
    transactions: Transaction[],
    tickerData: TickerData[],
    priceHistory: PriceHistory,
    to: string
): PortfolioSnapshotPoint[] {
    if (transactions.length === 0) return []

    const dated = transactions
        .map((tx) => ({ tx, day: tx.buy_date.slice(0, 10) }))
        .toSorted((a, b) => a.tx.buy_date.localeCompare(b.tx.buy_date))

    const currentRates = getCambioRates(tickerData)
    const tickerDataMap = new Map(tickerData.map((td) => [td.ticker, td]))
    const lastClose = new Map<Ticker, number>()
    const lastTradePrice = new Map<Ticker, number>()
    const points: PortfolioSnapshotPoint[] = []
    let included = 0

    for (let day = dated[0]!.day; day <= to; day = addDaysToDateKey(day, 1)) {
        while (included < dated.length && dated[included]!.day <= day) {
            const { tx } = dated[included]!
            const price = getTransactionUnitPrice(tx)
            if (price) lastTradePrice.set(tx.ticker_id, price)
            included++
        }

        for (const [ticker, closes] of priceHistory) {
            const close = closes.get(day)
            if (close != null) lastClose.set(ticker, close)
        }

        const priceOf = (td: TickerData) =>
            lastClose.get(td.ticker) ?? lastTradePrice.get(td.ticker) ?? td.curr_price
        const dayRates = getCambioRates(
            tickerData.map((td) => ({ ...td, curr_price: priceOf(td) }))
        )

        const holdings = aggregateHoldings(
            dated.slice(0, included).map(({ tx }) => tx),
            tickerData,
            currentRates
        )
        const totals = computePortfolioTotals(holdings)

        const valueEur = holdings.reduce((sum, h) => {
            const td = tickerDataMap.get(h.ticker_id)
            const price = td ? priceOf(td) : h.current_price
            return sum + toEur(h.total_quantity * price, h.currency, dayRates)
        }, 0)

        points.push({
            date: day,
            valueEur,
            investedEur: totals.totalInvested,
            realizedGlEur: totals.totalRealized,
        })
    }

    return points
}
