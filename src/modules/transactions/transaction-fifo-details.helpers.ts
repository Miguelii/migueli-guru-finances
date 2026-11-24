import { formatCurrency } from '@/lib/portfolio/formaters'
import type { FifoLot } from '@/lib/portfolio/fifo-ledger'
import { Currency } from '@/types/core/Currency'
import type { Transaction } from '@/types/Transaction'
import { formatTimeUntil } from '@/modules/transactions/transactions-card/transactions-card.helpers'

function toDate(buyDate: Transaction['buy_date']): Date {
    return new Date(buyDate.replace(' ', 'T'))
}

/**
 * EUR amount with an explicit sign for gains: "+353,04 €", "-12,10 €".
 * @param value - Amount in EUR.
 */
export function formatSignedEur(value: number): string {
    const formatted = formatCurrency(value, Currency.EUR)
    return value > 0 ? `+${formatted}` : formatted
}

/**
 * How long a lot was held before it was sold, e.g. "1 year, 8 months".
 * @param acquiredAt - Date of the BUY/REWARD that opened the lot.
 * @param soldAt - Date of the SELL.
 */
export function formatHoldingPeriod(
    acquiredAt: Transaction['buy_date'],
    soldAt: Transaction['buy_date']
): string {
    return formatTimeUntil(toDate(soldAt), toDate(acquiredAt))
}

/**
 * Share of a lot already sold, between 0 and 1. Never rounds an open lot up to 1.
 * @param lot - The lot entry of the FIFO ledger.
 */
export function getSoldShare(lot: FifoLot): number {
    if (lot.isClosed || lot.acquiredQuantity <= 0) return 1
    return Math.min(lot.soldQuantity / lot.acquiredQuantity, 0.999)
}

/**
 * Sold share as a percentage label, e.g. "99,9 %".
 * @param share - Share between 0 and 1.
 */
export function formatSoldShare(share: number): string {
    return share.toLocaleString('pt-PT', { style: 'percent', maximumFractionDigits: 1 })
}
