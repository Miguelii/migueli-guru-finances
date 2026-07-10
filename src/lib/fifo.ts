import type { CambioRates, Transaction } from '@/types/Transaction'
import { Currency, TransactionType } from '@/types/Transaction'
import { toEur } from '@/lib/utils'

/** Quantities below this threshold are treated as zero (floating-point residue). */
const QUANTITY_EPSILON = 1e-9

type Lot = {
    quantity: number
    unitCost: number
    unitCostEur: number
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
function txToEurRate(tx: Transaction, currency: Currency, rates: CambioRates): number {
    if (currency === Currency.EUR) return 1
    return tx.exchange_rate ?? toEur(1, currency, rates)
}

/**
 * Consumes lots from the front of the FIFO queue (oldest first), mutating `lots`,
 * and returns the cost basis of the consumed quantity in the asset currency and
 * in historical EUR. If the requested quantity exceeds what is held, only the
 * available lots are consumed (the excess has zero cost), so the position never
 * goes negative.
 *
 * @param lots - FIFO queue of open lots (mutated in place).
 * @param quantity - Quantity to consume.
 */
function consumeLots(lots: Lot[], quantity: number): { costOfSold: number; costOfSoldEur: number } {
    let remaining = quantity
    let costOfSold = 0
    let costOfSoldEur = 0

    while (remaining > QUANTITY_EPSILON && lots.length > 0) {
        const lot = lots[0]
        const consumed = Math.min(lot.quantity, remaining)

        costOfSold += consumed * lot.unitCost
        costOfSoldEur += consumed * lot.unitCostEur
        lot.quantity -= consumed
        remaining -= consumed

        if (lot.quantity <= QUANTITY_EPSILON) {
            lots.shift()
        }
    }

    return { costOfSold, costOfSoldEur }
}

/**
 * Single chronological pass over a ticker's transactions using FIFO lot accounting:
 * BUYs and REWARDs open lots (REWARDs at zero cost), SELLs consume the oldest lots
 * first — realized G/L is fixed at sell time, so later buys never change it.
 * Costs and fees are tracked in the asset currency and in EUR at each
 * transaction's historical rate ({@link txToEurRate}).
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

    for (const tx of txs.toSorted(byChronologicalOrder)) {
        const quantity = tx.quantity ?? 0
        const value = tx.value ?? (tx.transaction_price ?? 0) * quantity
        const eurRate = txToEurRate(tx, currency, rates)

        totalFeesEur += tx.fee * eurRate

        if (tx.type === TransactionType.Buy) {
            if (quantity > 0) {
                const unitCost = value / quantity
                lots.push({ quantity, unitCost, unitCostEur: unitCost * eurRate })
            }
            acquiredQuantity += quantity
            acquiredCost += value
            buyFees += tx.fee
        } else if (tx.type === TransactionType.Reward) {
            if (quantity > 0) {
                lots.push({ quantity, unitCost: 0, unitCostEur: 0 })
            }
            acquiredQuantity += quantity
            otherFees += tx.fee
        } else if (tx.type === TransactionType.Fee) {
            otherFees += tx.fee
        } else if (tx.type === TransactionType.Sell) {
            const { costOfSold, costOfSoldEur } = consumeLots(lots, quantity)

            realizedGl += value - costOfSold - tx.fee
            realizedGlEur += (value - tx.fee) * eurRate - costOfSoldEur
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
    }
}
