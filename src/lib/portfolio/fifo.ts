import type { CambioRates, Transaction } from '@/types/Transaction'
import { Currency } from '@/types/core/Currency'
import { TransactionType } from '@/types/Transaction'
import { toEur } from '@/lib/utils'

/** Quantities below this threshold are treated as zero (floating-point residue). */
export const QUANTITY_EPSILON = 1e-9

type Lot = {
    /** Id of the BUY or REWARD that opened the lot */
    txId: string
    quantity: number
    unitCost: number
    unitCostEur: number
}

type LotSlice = {
    lotId: string
    quantity: number
    costEur: number
}

/** Part of a SELL matched against one lot by FIFO. */
type FifoMatch = {
    sellId: string
    /** Id of the BUY or REWARD that opened the lot */
    lotId: string
    quantity: number
    /** Historical EUR cost of the matched quantity */
    costEur: number
    /** Share of the sell's net proceeds (value minus fee) in EUR, pro rata by quantity */
    proceedsEur: number
}

/**
 * Compares transactions chronologically by `buy_date` (ascending). On equal dates,
 * SELL sorts last so a same-moment acquisition is available to be sold.
 *
 * @param a - First transaction.
 * @param b - Second transaction.
 */
function byChronologicalOrder(a: Transaction, b: Transaction): number {
    const dateDiff = a.buy_date.localeCompare(b.buy_date)
    if (dateDiff !== 0) return dateDiff

    const aSell = a.type === TransactionType.Sell ? 1 : 0
    const bSell = b.type === TransactionType.Sell ? 1 : 0

    return aSell - bSell
}

/**
 * Resolves the EUR conversion multiplier for a transaction: `1` for EUR assets,
 * otherwise the historical `exchange_rate` captured on the transaction, falling
 * back to the current rate when none was recorded.
 *
 * @param tx - The transaction to resolve the rate for.
 * @param currency - The asset's currency.
 * @param rates - Current exchange rates (fallback).
 */
export function txToEurRate(tx: Transaction, currency: Currency, rates: CambioRates): number {
    if (currency === Currency.EUR) return 1
    return tx.exchange_rate ?? toEur(1, currency, rates)
}

/**
 * Consumes lots from the front of the FIFO queue (oldest first), mutating `lots`,
 * and returns the cost basis of the consumed quantity in the asset currency and
 * in historical EUR, plus the slice taken from each lot. If the requested quantity
 * exceeds what is held, only the available lots are consumed (the excess has zero
 * cost), so the position never goes negative.
 *
 * @param lots - FIFO queue of open lots (mutated in place).
 * @param quantity - Quantity to consume.
 */
function consumeLots(lots: Lot[], quantity: number) {
    let remaining = quantity
    let costOfSold = 0
    let costOfSoldEur = 0
    const slices: LotSlice[] = []

    while (remaining > QUANTITY_EPSILON && lots.length > 0) {
        const lot = lots[0]
        const consumed = Math.min(lot.quantity, remaining)
        const consumedCostEur = consumed * lot.unitCostEur

        costOfSold += consumed * lot.unitCost
        costOfSoldEur += consumedCostEur
        slices.push({ lotId: lot.txId, quantity: consumed, costEur: consumedCostEur })
        lot.quantity -= consumed
        remaining -= consumed

        if (lot.quantity <= QUANTITY_EPSILON) {
            lots.shift()
        }
    }

    return { costOfSold, costOfSoldEur, slices }
}

/**
 * Single chronological pass over a ticker's transactions using FIFO lot accounting:
 * BUYs and REWARDs open lots (REWARDs at zero cost), SELLs consume the oldest lots
 * first — realized G/L is fixed at sell time, so later buys never change it.
 * Costs and fees are tracked in the asset currency and in EUR at each
 * transaction's historical rate ({@link txToEurRate}). `matches` lists which lot
 * each SELL consumed, oldest sell and oldest lot first.
 *
 * @param txs - Transactions for a single ticker (any order — sorted internally).
 * @param currency - The asset's currency.
 * @param rates - Current exchange rates (fallback for transactions without a historical rate).
 */
export function processTransactions(txs: Transaction[], currency: Currency, rates: CambioRates) {
    const lots: Lot[] = []
    let realizedGl = 0
    let realizedGlEur = 0
    let realizedCostBasis = 0
    let buyFees = 0
    let totalSellFees = 0
    let otherFees = 0
    let totalFeesEur = 0
    let acquiredQuantity = 0
    let acquiredCost = 0
    const matches: FifoMatch[] = []

    for (const tx of txs.toSorted(byChronologicalOrder)) {
        const quantity = tx.quantity ?? 0
        const value = tx.value ?? (tx.transaction_price ?? 0) * quantity
        const eurRate = txToEurRate(tx, currency, rates)

        totalFeesEur += tx.fee * eurRate

        if (tx.type === TransactionType.Buy) {
            if (quantity > 0) {
                const unitCost = value / quantity
                lots.push({ txId: tx.id, quantity, unitCost, unitCostEur: unitCost * eurRate })
            }
            acquiredQuantity += quantity
            acquiredCost += value
            buyFees += tx.fee
        } else if (tx.type === TransactionType.Reward) {
            if (quantity > 0) {
                lots.push({ txId: tx.id, quantity, unitCost: 0, unitCostEur: 0 })
            }
            acquiredQuantity += quantity
            otherFees += tx.fee
        } else if (tx.type === TransactionType.Fee) {
            otherFees += tx.fee
        } else if (tx.type === TransactionType.Sell) {
            const { costOfSold, costOfSoldEur, slices } = consumeLots(lots, quantity)
            const netProceedsEur = (value - tx.fee) * eurRate

            for (const slice of slices) {
                matches.push({
                    sellId: tx.id,
                    lotId: slice.lotId,
                    quantity: slice.quantity,
                    costEur: slice.costEur,
                    proceedsEur: netProceedsEur * (slice.quantity / quantity),
                })
            }

            realizedGl += value - costOfSold - tx.fee
            realizedGlEur += netProceedsEur - costOfSoldEur
            realizedCostBasis += costOfSold
            totalSellFees += tx.fee
        }
    }

    let totalQuantity = 0
    let totalInvested = 0
    let totalInvestedEur = 0

    for (const lot of lots) {
        totalQuantity += lot.quantity
        totalInvested += lot.quantity * lot.unitCost
        totalInvestedEur += lot.quantity * lot.unitCostEur
    }

    if (totalQuantity < QUANTITY_EPSILON) {
        totalQuantity = 0
        totalInvested = 0
        totalInvestedEur = 0
    }

    // Fully sold positions fall back to the average over all acquisitions,
    // so the UI can still show what the position used to cost.
    let avgCost = 0
    if (totalQuantity > 0) {
        avgCost = totalInvested / totalQuantity
    } else if (acquiredQuantity > 0) {
        avgCost = acquiredCost / acquiredQuantity
    }

    return {
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
        matches,
    }
}
