import { txToEurRate } from '@/lib/portfolio/fifo'
import { addDaysToDateKey } from '@/lib/portfolio/portfolio-snapshots'
import {
    Currency,
    TransactionType,
    type CambioRates,
    type Ticker,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'

const DAYS_PER_YEAR = 365
const MS_PER_DAY = 86_400_000
// Shorter histories annualize a few weeks of noise into absurd yearly rates
const MIN_HISTORY_DAYS = 90
const MAX_ITERATIONS = 100
const TOLERANCE = 1e-7
const RATE_SEARCH_RANGE = { min: -0.99, max: 10 }
const INITIAL_GUESS = 0.1

export type AnnualizedReturn = {
    /** Yearly rate, `0.08` = 8% */
    rate: number
    /** Day of the first cash flow, `YYYY-MM-DD` */
    since: string
}

export type OpeningValue = {
    /** Day of the snapshot, `YYYY-MM-DD` (value at that day's close) */
    date: string
    valueEur: number
}

type CashFlow = {
    /** Years since the first cash flow */
    years: number
    amountEur: number
}

/**
 * EUR cash flow of a transaction from the investor's point of view: money put in is
 * negative (BUY value plus fee, FEE), money taken out is positive (SELL value minus fee).
 * REWARDs bring no cash, their value only shows up in the current portfolio value.
 *
 * @param tx - The transaction.
 * @param currency - The asset's currency.
 * @param rates - Current exchange rates (fallback when the transaction has no rate).
 */
function getCashFlowEur(tx: Transaction, currency: Currency, rates: CambioRates): number {
    const eurRate = txToEurRate(tx, currency, rates)
    const value = tx.value ?? 0

    if (tx.type === TransactionType.Buy) return -(value + tx.fee) * eurRate
    if (tx.type === TransactionType.Sell) return (value - tx.fee) * eurRate
    if (tx.type === TransactionType.Fee) return -tx.fee * eurRate
    return 0
}

/**
 * The opening snapshot as money put in at the start of the next day, as if the
 * portfolio had been bought at its closing value.
 *
 * @param opening - The starting snapshot.
 */
function toOpeningFlow(opening: OpeningValue) {
    const day = addDaysToDateKey(opening.date, 1)
    return { time: new Date(`${day}T00:00:00`).getTime(), day, amountEur: -opening.valueEur }
}

function netPresentValue(flows: CashFlow[], rate: number): number {
    return flows.reduce((sum, flow) => sum + flow.amountEur / (1 + rate) ** flow.years, 0)
}

function netPresentValueDerivative(flows: CashFlow[], rate: number): number {
    return flows.reduce(
        (sum, flow) => sum - (flow.years * flow.amountEur) / (1 + rate) ** (flow.years + 1),
        0
    )
}

/**
 * Finds the rate where the net present value of the cash flows is zero: Newton's
 * method first, bisection over `RATE_SEARCH_RANGE` when Newton does not converge.
 *
 * @param flows - Dated cash flows (at least one negative and one positive).
 */
function solveRate(flows: CashFlow[]): number | null {
    let rate = INITIAL_GUESS

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const npv = netPresentValue(flows, rate)
        const derivative = netPresentValueDerivative(flows, rate)
        if (derivative === 0 || !Number.isFinite(derivative)) break

        const next = rate - npv / derivative
        if (!Number.isFinite(next) || next <= RATE_SEARCH_RANGE.min) break
        if (Math.abs(next - rate) < TOLERANCE) return next
        rate = next
    }

    let low = RATE_SEARCH_RANGE.min
    let high = RATE_SEARCH_RANGE.max
    let npvLow = netPresentValue(flows, low)
    if (npvLow * netPresentValue(flows, high) > 0) return null

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const mid = (low + high) / 2
        const npvMid = netPresentValue(flows, mid)
        if (Math.abs(high - low) < TOLERANCE) return mid

        if (npvLow * npvMid <= 0) {
            high = mid
        } else {
            low = mid
            npvLow = npvMid
        }
    }

    return (low + high) / 2
}

/**
 * Annualized money-weighted return (XIRR) of the portfolio in EUR: every BUY, SELL and
 * FEE is a dated cash flow (at its historical exchange rate) and today's value is the
 * final inflow, so it accounts for how long each euro has been invested and for the
 * realized gains. With `opening`, the period starts the day after that snapshot: its
 * value counts as money put in on that day and only later transactions are used.
 * Returns `null` when the period is shorter than `MIN_HISTORY_DAYS` or the rate cannot
 * be solved.
 *
 * @param transactions - All portfolio transactions (any order).
 * @param tickerData - Ticker metadata (used to resolve each asset's currency).
 * @param rates - Current exchange rates (fallback when a transaction has no rate).
 * @param currentValueEur - Today's market value of the open positions, in EUR.
 * @param opening - Optional starting snapshot (`date` is its `YYYY-MM-DD` day, valued at close).
 * @param now - Date of the final inflow (defaults to the current date).
 */
export function computeAnnualizedReturn(
    transactions: Transaction[],
    tickerData: TickerData[],
    rates: CambioRates,
    currentValueEur: number,
    opening?: OpeningValue,
    now: Date = new Date()
): AnnualizedReturn | null {
    const currencyMap = new Map<Ticker, Currency>(tickerData.map((td) => [td.ticker, td.currency]))

    const transactionFlows = transactions
        .filter((tx) => !opening || tx.buy_date.slice(0, 10) > opening.date)
        .map((tx) => ({
            time: new Date(tx.buy_date.replace(' ', 'T')).getTime(),
            day: tx.buy_date.slice(0, 10),
            amountEur: getCashFlowEur(tx, currencyMap.get(tx.ticker_id) ?? Currency.EUR, rates),
        }))

    const openingFlows = opening ? [toOpeningFlow(opening)] : []

    const dated = [...openingFlows, ...transactionFlows]
        .filter((flow) => flow.amountEur !== 0)
        .toSorted((a, b) => a.time - b.time)

    const first = dated.at(0)
    if (!first) return null

    const historyDays = (now.getTime() - first.time) / MS_PER_DAY
    if (historyDays < MIN_HISTORY_DAYS) return null

    const toYears = (time: number) => (time - first.time) / MS_PER_DAY / DAYS_PER_YEAR
    const flows: CashFlow[] = [
        ...dated.map((flow) => ({ years: toYears(flow.time), amountEur: flow.amountEur })),
        { years: toYears(now.getTime()), amountEur: currentValueEur },
    ]

    const hasOutflow = flows.some((flow) => flow.amountEur < 0)
    const hasInflow = flows.some((flow) => flow.amountEur > 0)
    if (!hasOutflow || !hasInflow) return null

    const rate = solveRate(flows)
    if (rate === null) return null

    return { rate, since: first.day }
}
