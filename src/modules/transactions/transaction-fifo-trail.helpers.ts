import type { FifoLot, FifoSell } from '@/lib/portfolio/fifo-ledger'
import { TransactionType, type Transaction } from '@/types/Transaction'
import { MAX_TRAIL_LINKS } from '@/modules/transactions/transaction-fifo-trail.constants'

type FifoTrailLink = {
    targetId: string
    targetType: TransactionType
    date: Transaction['buy_date']
    quantity: number
    taxRate: number | null
}

export type FifoTrail = {
    /** `sell`: the lots a SELL consumed (older rows). `lot`: the sales that consumed a lot (newer rows) */
    kind: 'sell' | 'lot'
    links: FifoTrailLink[]
    /** Links left out of the row, listed in the detail drawer */
    hiddenCount: number
    /** Quantity of the lot not sold yet (always 0 for a SELL) */
    remainingQuantity: number
}

/**
 * FIFO links shown under a transaction row: the lots a SELL consumed, or the sales that
 * consumed a BUY/REWARD lot, capped at `maxLinks`. `null` when the transaction has no link.
 * @param sell - The transaction's SELL entry in the FIFO ledger, if any.
 * @param lot - The transaction's lot entry in the FIFO ledger, if any.
 * @param maxLinks - Maximum links kept in the row.
 */
export function buildFifoTrail(
    sell?: FifoSell,
    lot?: FifoLot,
    maxLinks = MAX_TRAIL_LINKS
): FifoTrail | null {
    if (sell && sell.lots.length > 0) {
        return {
            kind: 'sell',
            links: sell.lots.slice(0, maxLinks).map((sellLot) => ({
                targetId: sellLot.lotId,
                targetType: sellLot.lotType,
                date: sellLot.acquiredAt,
                quantity: sellLot.quantity,
                taxRate: sellLot.taxRate,
            })),
            hiddenCount: Math.max(sell.lots.length - maxLinks, 0),
            remainingQuantity: 0,
        }
    }

    if (lot && lot.sales.length > 0) {
        return {
            kind: 'lot',
            links: lot.sales.slice(0, maxLinks).map((sale) => ({
                targetId: sale.sellId,
                targetType: TransactionType.Sell,
                date: sale.soldAt,
                quantity: sale.quantity,
                taxRate: sale.taxRate,
            })),
            hiddenCount: Math.max(lot.sales.length - maxLinks, 0),
            remainingQuantity: lot.remainingQuantity,
        }
    }

    return null
}
