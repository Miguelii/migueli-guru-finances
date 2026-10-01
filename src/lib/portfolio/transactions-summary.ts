import { txToEurRate } from '@/lib/portfolio/fifo'
import {
    Currency,
    TransactionType,
    type CambioRates,
    type Ticker,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'

const MONTHS = 12

export type TransactionsSummary = {
    boughtEur: number
    soldEur: number
    feesEur: number
    rewardsCount: number
    count: number
}

/** One bar of the monthly purchases chart: month index (0 = January) + EUR per ticker */
type MonthlyPurchasesBucket = { month: number } & Partial<Record<Ticker, number>>

type MonthlyPurchasesAsset = {
    ticker: Ticker
    totalEur: number
    avgEur: number
    /** Share of the year's purchases, in percent */
    share: number
}

export type MonthlyPurchasesEur = {
    months: MonthlyPurchasesBucket[]
    assets: MonthlyPurchasesAsset[]
    totalEur: number
    avgEur: number
    /** Month with the highest purchases (`null` when nothing was bought) */
    bestMonth: { month: number; totalEur: number } | null
}

/**
 * Value of a transaction in EUR at its historical `exchange_rate` (current rate fallback).
 * @param tx - Transaction to convert.
 * @param currency - The asset's currency.
 * @param rates - Current exchange rates (fallback).
 */
export function getTransactionValueEur(
    tx: Transaction,
    currency: Currency,
    rates: CambioRates
): number {
    return (tx.value ?? 0) * txToEurRate(tx, currency, rates)
}

/**
 * Fee of a transaction in EUR at its historical `exchange_rate` (current rate fallback).
 * @param tx - Transaction to convert.
 * @param currency - The asset's currency.
 * @param rates - Current exchange rates (fallback).
 */
export function getTransactionFeeEur(
    tx: Transaction,
    currency: Currency,
    rates: CambioRates
): number {
    return tx.fee * txToEurRate(tx, currency, rates)
}

/**
 * EUR totals of a list of transactions: BUY and SELL values, every fee, and how many
 * REWARDs there are (rewards have no cost, so only their count is meaningful).
 * @param transactions - Transactions to summarize (e.g. the filtered list).
 * @param currencyMap - Currency per ticker.
 * @param rates - Current exchange rates (fallback for transactions without a rate).
 */
export function summarizeTransactions(
    transactions: Transaction[],
    currencyMap: Map<Ticker, Currency>,
    rates: CambioRates
): TransactionsSummary {
    const summary: TransactionsSummary = {
        boughtEur: 0,
        soldEur: 0,
        feesEur: 0,
        rewardsCount: 0,
        count: transactions.length,
    }

    for (const tx of transactions) {
        const currency = currencyMap.get(tx.ticker_id) ?? Currency.EUR

        if (tx.type === TransactionType.Buy) {
            summary.boughtEur += getTransactionValueEur(tx, currency, rates)
        }
        if (tx.type === TransactionType.Sell) {
            summary.soldEur += getTransactionValueEur(tx, currency, rates)
        }
        if (tx.type === TransactionType.Reward) summary.rewardsCount += 1

        summary.feesEur += getTransactionFeeEur(tx, currency, rates)
    }

    return summary
}

/**
 * EUR spent on BUYs per month and per asset for a calendar year, at each transaction's
 * historical rate. Assets are sorted by yearly total, largest first.
 * @param transactions - All portfolio transactions.
 * @param tickerData - Ticker metadata (asset currency).
 * @param rates - Current exchange rates (fallback).
 * @param year - Calendar year to aggregate.
 */
export function aggregateMonthlyPurchasesEur(
    transactions: Transaction[],
    tickerData: TickerData[],
    rates: CambioRates,
    year: number
): MonthlyPurchasesEur {
    const currencyMap = new Map<Ticker, Currency>(tickerData.map((td) => [td.ticker, td.currency]))
    const months: MonthlyPurchasesBucket[] = Array.from({ length: MONTHS }, (_, month) => ({
        month,
    }))
    const monthTotals = Array.from({ length: MONTHS }, () => 0)
    const assetTotals = new Map<Ticker, number>()

    for (const tx of transactions) {
        if (tx.type !== TransactionType.Buy || tx.value == null) continue

        const date = new Date(tx.buy_date.replace(' ', 'T'))
        if (date.getFullYear() !== year) continue

        const month = date.getMonth()
        const valueEur = getTransactionValueEur(
            tx,
            currencyMap.get(tx.ticker_id) ?? Currency.EUR,
            rates
        )

        months[month]![tx.ticker_id] = (months[month]![tx.ticker_id] ?? 0) + valueEur
        monthTotals[month]! += valueEur
        assetTotals.set(tx.ticker_id, (assetTotals.get(tx.ticker_id) ?? 0) + valueEur)
    }

    const totalEur = monthTotals.reduce((sum, value) => sum + value, 0)

    const assets = Array.from(assetTotals, ([ticker, assetTotal]) => ({
        ticker,
        totalEur: assetTotal,
        avgEur: assetTotal / MONTHS,
        share: totalEur > 0 ? (assetTotal / totalEur) * 100 : 0,
    })).toSorted((a, b) => b.totalEur - a.totalEur)

    const bestMonthIndex = monthTotals.reduce(
        (best, value, month) => (value > monthTotals[best]! ? month : best),
        0
    )

    return {
        months,
        assets,
        totalEur,
        avgEur: totalEur / MONTHS,
        bestMonth:
            totalEur > 0 ? { month: bestMonthIndex, totalEur: monthTotals[bestMonthIndex]! } : null,
    }
}
