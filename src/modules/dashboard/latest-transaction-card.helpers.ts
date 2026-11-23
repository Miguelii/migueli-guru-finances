import { getCapitalGainsTax } from '@/lib/portfolio/capital-gains-tax'
import { formatCurrency, formatQuantity } from '@/lib/portfolio/formaters'
import type { Currency } from '@/types/core/Currency'
import type { TickerType } from '@/types/core/TickerType'
import { TransactionType, type Transaction } from '@/types/Transaction'
import { getTaxBadge } from '@/modules/transactions/transactions-card/transactions-card.helpers'

const EMPTY_VALUE = '-'

const SHORT_ID_LENGTH = 6

export type ReceiptLine = {
    label: string
    value: string
    /** Amounts are blurred while prices are hidden */
    isAmount: boolean
}

/**
 * Detail lines printed on the latest transaction receipt, in the asset's own currency.
 *
 * @param tx - The transaction.
 * @param currency - The asset's currency.
 * @param tickerType - The asset type (decides the capital gains tax line).
 */
export function buildReceiptLines(
    tx: Transaction,
    currency: Currency,
    tickerType: TickerType | undefined
): ReceiptLine[] {
    const tax = getTaxBadge(getCapitalGainsTax(tx, tickerType))
    const hasQuantity = tx.quantity != null && tx.type !== TransactionType.Fee

    return [
        {
            label: 'Quantity',
            value: hasQuantity ? `${formatQuantity(tx.quantity!)} ${tx.ticker_id}` : EMPTY_VALUE,
            isAmount: true,
        },
        {
            label: 'Price',
            value:
                tx.transaction_price != null
                    ? formatCurrency(tx.transaction_price, currency)
                    : EMPTY_VALUE,
            isAmount: true,
        },
        {
            label: 'Value',
            value: tx.value != null ? formatCurrency(tx.value, currency) : EMPTY_VALUE,
            isAmount: true,
        },
        { label: 'Fee', value: formatCurrency(tx.fee, currency), isAmount: true },
        ...(tax ? [{ label: 'Capital gains tax', value: tax.label, isAmount: false }] : []),
    ]
}

/**
 * Short reference of a transaction id for the receipt header (e.g. "#A1B2C3").
 *
 * @param id - Transaction id (uuid).
 */
export function toReceiptNumber(id: string): string {
    return `#${id.replaceAll('-', '').slice(0, SHORT_ID_LENGTH).toUpperCase()}`
}
