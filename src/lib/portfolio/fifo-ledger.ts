import { getCapitalGainsRateAt } from '@/lib/portfolio/capital-gains-tax'
import { processTransactions, QUANTITY_EPSILON } from '@/lib/portfolio/fifo'
import { Currency } from '@/types/core/Currency'
import type { Ticker } from '@/types/core/Ticker'
import {
    TransactionType,
    type CambioRates,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'

/** One lot consumed by a SELL. */
export type FifoSellLot = {
    lotId: string
    lotType: TransactionType
    acquiredAt: Transaction['buy_date']
    quantity: number
    costEur: number
    gainEur: number
    /** Rate for the holding period at the sale date, `null` when the asset type has no rule */
    taxRate: number | null
}

export type FifoSell = {
    /** Oldest lot first */
    lots: FifoSellLot[]
    costEur: number
    gainEur: number
    /** Sold quantity with no open lot behind it (it enters at zero cost) */
    unmatchedQuantity: number
    /** Distinct rates applied to the lots, highest first */
    taxRates: number[]
}

/** One SELL that consumed part of a lot. */
type FifoLotSale = {
    sellId: string
    soldAt: Transaction['buy_date']
    quantity: number
    gainEur: number
    taxRate: number | null
}

export type FifoLot = {
    acquiredQuantity: number
    soldQuantity: number
    remainingQuantity: number
    /** The whole lot was sold, so it no longer counts towards the position */
    isClosed: boolean
    /** Oldest sale first */
    sales: FifoLotSale[]
}

export type FifoLedger = {
    /** Keyed by SELL id */
    sells: Map<string, FifoSell>
    /** Keyed by the id of the BUY/REWARD that opened the lot; only lots touched by a sale */
    lots: Map<string, FifoLot>
}

function toZero(quantity: number): number {
    return quantity > QUANTITY_EPSILON ? quantity : 0
}

/**
 * Links every SELL to the lots it consumed under FIFO, and every lot to the sales that
 * consumed it, with the gain and capital gains tax rate of each match in EUR.
 *
 * @param transactions - All transactions (any order, any ticker). Filtering them first would
 * change which lots each sale consumes.
 * @param tickerData - Ticker metadata (currency and asset type).
 * @param rates - Current exchange rates (fallback for transactions without a historical rate).
 */
export function buildFifoLedger(
    transactions: Transaction[],
    tickerData: TickerData[],
    rates: CambioRates
): FifoLedger {
    const tickerMap = new Map<Ticker, TickerData>(tickerData.map((td) => [td.ticker, td]))
    const txById = new Map(transactions.map((tx) => [tx.id, tx]))
    const byTicker = new Map<Ticker, Transaction[]>()
    const sells = new Map<string, FifoSell>()
    const lots = new Map<string, FifoLot>()

    for (const tx of transactions) {
        const tickerTransactions = byTicker.get(tx.ticker_id) ?? []
        tickerTransactions.push(tx)
        byTicker.set(tx.ticker_id, tickerTransactions)

        if (tx.type === TransactionType.Sell && (tx.quantity ?? 0) > 0) {
            sells.set(tx.id, {
                lots: [],
                costEur: 0,
                gainEur: 0,
                unmatchedQuantity: tx.quantity ?? 0,
                taxRates: [],
            })
        }
    }

    for (const [ticker, tickerTransactions] of byTicker) {
        const td = tickerMap.get(ticker)
        const { matches } = processTransactions(
            tickerTransactions,
            td?.currency ?? Currency.EUR,
            rates
        )

        for (const match of matches) {
            const sellTx = txById.get(match.sellId)
            const lotTx = txById.get(match.lotId)
            const sell = sells.get(match.sellId)

            if (!sellTx || !lotTx || !sell) continue

            const gainEur = match.proceedsEur - match.costEur
            const taxRate = getCapitalGainsRateAt(lotTx.buy_date, sellTx.buy_date, td?.type)

            sell.lots.push({
                lotId: lotTx.id,
                lotType: lotTx.type,
                acquiredAt: lotTx.buy_date,
                quantity: match.quantity,
                costEur: match.costEur,
                gainEur,
                taxRate,
            })
            sell.costEur += match.costEur
            sell.gainEur += gainEur
            sell.unmatchedQuantity -= match.quantity

            const lot = lots.get(lotTx.id) ?? {
                acquiredQuantity: lotTx.quantity ?? 0,
                soldQuantity: 0,
                remainingQuantity: 0,
                isClosed: false,
                sales: [],
            }
            lot.soldQuantity += match.quantity
            lot.sales.push({
                sellId: sellTx.id,
                soldAt: sellTx.buy_date,
                quantity: match.quantity,
                gainEur,
                taxRate,
            })
            lots.set(lotTx.id, lot)
        }
    }

    for (const sell of sells.values()) {
        sell.unmatchedQuantity = toZero(sell.unmatchedQuantity)
        sell.taxRates = Array.from(
            new Set(sell.lots.flatMap((lot) => (lot.taxRate === null ? [] : [lot.taxRate])))
        ).toSorted((a, b) => b - a)
    }

    for (const lot of lots.values()) {
        lot.remainingQuantity = toZero(lot.acquiredQuantity - lot.soldQuantity)
        lot.isClosed = lot.remainingQuantity === 0
    }

    return { sells, lots }
}
