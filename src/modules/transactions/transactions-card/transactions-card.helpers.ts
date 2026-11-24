import { getCambioRates } from '@/lib/utils'
import { processTransactions } from '@/lib/portfolio/fifo'
import { ALL_TRANSACTION_ASSETS, ALL_TRANSACTION_TYPES } from '@/lib/constants/transactions'
import { Currency } from '@/types/core/Currency'
import { type Transaction, type TickerData, TransactionType } from '@/types/Transaction'
import type { Ticker } from '@/types/core/Ticker'
import { formatTaxRate, type CapitalGainsTax } from '@/lib/portfolio/capital-gains-tax'
import type { FifoLot, FifoSell } from '@/lib/portfolio/fifo-ledger'

const DAY_MS = 1000 * 60 * 60 * 24

export type TaxBadge = {
    label: string
    /** Shown in the success color: lowest rate reached (tax-free crypto or the last ETF/stock bracket), or a tax-free sale */
    isFinal: boolean
}

export type TransactionMonthGroup = {
    key: string
    label: string
    transactions: Transaction[]
}

export type TransactionTypeFilter = typeof ALL_TRANSACTION_TYPES | TransactionType

/**
 * Time left from `now` until `date`, e.g. "1 year, 5 months", "2 months, 4 days", "12 days".
 * Days are only shown for spans under a year.
 * @param date - Future date.
 * @param now - Reference time (defaults to now).
 */
export function formatTimeUntil(date: Date, now = new Date()): string {
    let months = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth())
    const dayAnchor = new Date(now)
    dayAnchor.setMonth(dayAnchor.getMonth() + months)
    if (dayAnchor > date) {
        months -= 1
        dayAnchor.setMonth(dayAnchor.getMonth() - 1)
    }
    const days = Math.ceil((date.getTime() - dayAnchor.getTime()) / DAY_MS)
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    const parts: string[] = []
    if (years > 0) parts.push(years === 1 ? '1 year' : `${years} years`)
    if (remainingMonths > 0) {
        parts.push(remainingMonths === 1 ? '1 month' : `${remainingMonths} months`)
    }
    if (years === 0 && days > 0) parts.push(days === 1 ? '1 day' : `${days} days`)
    return parts.join(', ') || 'today'
}

/**
 * Badge for the capital gains rules of a BUY: "Tax-free" once exempt, "Tax-free in 3 months"
 * before the crypto exemption, "28% · 25.2% in 1 year, 5 months" for ETF/stock brackets and
 * just the rate once the last bracket is reached. `null` when no rule applies.
 * @param tax - Result of `getCapitalGainsTax`.
 * @param now - Reference time (defaults to now).
 */
export function getTaxBadge(tax: CapitalGainsTax | null, now = new Date()): TaxBadge | null {
    if (tax == null) return null

    if (tax.rate === 0) return { label: 'Tax-free', isFinal: true }

    if (tax.next == null) return { label: formatTaxRate(tax.rate), isFinal: true }

    const timeLeft = formatTimeUntil(tax.next.date, now)

    if (tax.next.rate === 0) return { label: `Tax-free in ${timeLeft}`, isFinal: false }

    return {
        label: `${formatTaxRate(tax.rate)} · ${formatTaxRate(tax.next.rate)} in ${timeLeft}`,
        isFinal: false,
    }
}

/**
 * Tax rate applied to a sold lot: "Tax-free" when exempt, otherwise the rate ("28%").
 * @param rate - Rate between 0 and 1.
 */
export function formatSaleTaxRate(rate: number): string {
    return rate === 0 ? 'Tax-free' : formatTaxRate(rate)
}

/**
 * Badge for the tax outcome of a SELL from the FIFO lots it consumed: "Tax-free" or a single
 * rate when every lot shares it, "Partly tax-free" when only some lots are exempt and
 * "28% / 25.2%" when the lots fall in different taxed brackets. `null` when no rule applies.
 * @param sell - The SELL entry of the FIFO ledger.
 */
export function getSellTaxBadge(sell?: FifoSell): TaxBadge | null {
    if (!sell || sell.taxRates.length === 0) return null

    const [highest, ...rest] = sell.taxRates

    if (rest.length === 0) {
        return { label: formatSaleTaxRate(highest!), isFinal: highest === 0 }
    }

    if (sell.taxRates.includes(0)) return { label: 'Partly tax-free', isFinal: false }

    return { label: sell.taxRates.map(formatTaxRate).join(' / '), isFinal: false }
}

/**
 * Tax badge of a transaction row: the FIFO outcome for a SELL, "Sold" for a lot that was sold
 * in full, otherwise the current capital gains rule of the BUY.
 * @param tax - Result of `getCapitalGainsTax` for the transaction.
 * @param sell - The transaction's SELL entry in the FIFO ledger, if any.
 * @param lot - The transaction's lot entry in the FIFO ledger, if any.
 */
export function getRowTaxBadge(
    tax: CapitalGainsTax | null,
    sell?: FifoSell,
    lot?: FifoLot
): TaxBadge | null {
    if (sell) return getSellTaxBadge(sell)
    if (lot?.isClosed) return { label: 'Sold', isFinal: false }
    return getTaxBadge(tax)
}

export function filterTransactions(
    transactions: Transaction[],
    asset: string,
    type: TransactionTypeFilter
): Transaction[] {
    return transactions.filter(
        (tx) =>
            (asset === ALL_TRANSACTION_ASSETS || tx.ticker_id === asset) &&
            (type === ALL_TRANSACTION_TYPES || tx.type === type)
    )
}

/**
 * Groups transactions by calendar month, keeping the input order (the repository already
 * returns them `buy_date` descending, so groups come out newest first).
 * @param transactions - Transactions sorted by date.
 */
export function groupTransactionsByMonth(transactions: Transaction[]): TransactionMonthGroup[] {
    const groups = new Map<string, TransactionMonthGroup>()

    for (const tx of transactions) {
        const key = tx.buy_date.slice(0, 7)
        let group = groups.get(key)

        if (!group) {
            const [year, month] = key.split('-').map(Number)
            group = {
                key,
                label: new Date(year!, month! - 1, 1).toLocaleDateString('pt-PT', {
                    month: 'long',
                    year: 'numeric',
                }),
                transactions: [],
            }
            groups.set(key, group)
        }

        group.transactions.push(tx)
    }

    return Array.from(groups.values())
}

export function calculateTransactionInvested(
    transactions: Transaction[],
    tickerData: TickerData[]
): Map<string, number> {
    const currencyMap = new Map<Ticker, Currency>(
        tickerData.map((ticker) => [ticker.ticker, ticker.currency])
    )
    const rates = getCambioRates(tickerData)
    const investedByTransaction = new Map<string, number>()
    const transactionsByTicker = new Map<Ticker, Transaction[]>()

    for (const transaction of transactions.toSorted((a, b) =>
        a.buy_date.localeCompare(b.buy_date)
    )) {
        const tickerTransactions = transactionsByTicker.get(transaction.ticker_id) ?? []
        tickerTransactions.push(transaction)
        transactionsByTicker.set(transaction.ticker_id, tickerTransactions)

        let totalInvested = 0
        for (const [ticker, currentTransactions] of transactionsByTicker) {
            const currency = currencyMap.get(ticker) ?? Currency.EUR
            totalInvested += processTransactions(
                currentTransactions,
                currency,
                rates
            ).totalInvestedEur
        }

        investedByTransaction.set(transaction.id, totalInvested)
    }

    return investedByTransaction
}
