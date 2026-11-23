import { TRANSACTIONS_ROUTE_PATH } from '@/lib/constants'
import { paramsUrlKeys } from '@/lib/core/searchParams'
import { formatCurrency, formatQuantity } from '@/lib/portfolio/formaters'
import { getTransactionFeeEur, getTransactionValueEur } from '@/lib/portfolio/transactions-summary'
import { Currency } from '@/types/core/Currency'
import { TransactionType, type CambioRates, type Transaction } from '@/types/Transaction'
import { TransactionDirection } from '@/modules/dashboard/recent-transactions-card.constants'

export type TransactionFlow = {
    direction: TransactionDirection
    /** Signed amount shown in lists (e.g. "-500,00 €" for a buy, "+0,0123 ETH" for a reward) */
    label: string
}

/**
 * How a transaction moves money from the user's point of view: buys and fees go out,
 * sells come in (in EUR at the transaction's rate) and rewards come in as quantity,
 * since they have no cost.
 *
 * @param tx - The transaction.
 * @param currency - The asset's currency.
 * @param rates - Current exchange rates (fallback for transactions without a rate).
 */
export function getTransactionFlow(
    tx: Transaction,
    currency: Currency,
    rates: CambioRates
): TransactionFlow {
    switch (tx.type) {
        case TransactionType.Buy:
            return {
                direction: TransactionDirection.Out,
                label: `-${formatCurrency(getTransactionValueEur(tx, currency, rates), Currency.EUR)}`,
            }
        case TransactionType.Sell:
            return {
                direction: TransactionDirection.In,
                label: `+${formatCurrency(getTransactionValueEur(tx, currency, rates), Currency.EUR)}`,
            }
        case TransactionType.Fee:
            return {
                direction: TransactionDirection.Out,
                label: `-${formatCurrency(getTransactionFeeEur(tx, currency, rates), Currency.EUR)}`,
            }
        case TransactionType.Reward:
            return {
                direction: TransactionDirection.In,
                label: `+${formatQuantity(tx.quantity ?? 0)} ${tx.ticker_id}`,
            }
    }
}

/**
 * Link to the transactions page with the transaction's detail drawer open.
 *
 * @param id - Transaction id.
 */
export function buildTransactionHref(id: string): string {
    const params = new URLSearchParams({ [paramsUrlKeys.transaction_id!]: id })
    return `${TRANSACTIONS_ROUTE_PATH}?${params.toString()}`
}
