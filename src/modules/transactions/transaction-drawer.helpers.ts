import {
    Currency,
    TransactionType,
    type Ticker,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'
import { processTransactions } from '@/lib/fifo'
import { getCambioRates } from '@/lib/utils'
import type { FormValues } from '@/modules/transactions/transaction-drawer'

type HoldingPreviewSide = {
    quantity: number
    avgCost: number
}

export type HoldingPreview = {
    currency: Currency
    before: HoldingPreviewSide
    after: HoldingPreviewSide
}

/**
 * Converts a DB date (`YYYY-MM-DD HH:mm:ss`) into a datetime-local input value.
 *
 * @param dbDate - Date string in DB format
 */
function toInputDate(dbDate: string): string {
    return dbDate.replace(' ', 'T').slice(0, 16)
}

/**
 * Converts a datetime-local input value into the DB format (`YYYY-MM-DD HH:mm:ss`).
 *
 * @param inputDate - datetime-local value (`YYYY-MM-DDTHH:mm`)
 */
export function toDbDate(inputDate: string): string {
    return `${inputDate.replace('T', ' ')}:00`
}

/**
 * Maps a transaction into the string-based form values used by the drawer.
 *
 * @param transaction - Transaction being edited
 */
export function toFormValues(transaction: Transaction): FormValues {
    return {
        ticker_id: transaction.ticker_id,
        type: transaction.type,
        buy_date: toInputDate(transaction.buy_date),
        quantity: transaction.quantity != null ? String(transaction.quantity) : '',
        transaction_price:
            transaction.transaction_price != null ? String(transaction.transaction_price) : '',
        value: transaction.value != null ? String(transaction.value) : '',
        fee: String(transaction.fee ?? 0),
        exchange_rate: transaction.exchange_rate != null ? String(transaction.exchange_rate) : '',
    }
}

/**
 * Converts an input string to a number, mapping empty strings to `undefined`.
 *
 * @param value - Raw input value
 */
export function toNumber(value: string): number | undefined {
    return value === '' ? undefined : Number(value)
}

/** Current date/time as a DB date string (`YYYY-MM-DD HH:mm:ss`). */
function nowDbDate(): string {
    return toDbDate(new Date().toISOString().slice(0, 16))
}

/**
 * Builds a hypothetical transaction from the drawer's form values so a holding
 * preview can be computed before the transaction is saved. Returns `null` when
 * there is not enough input to be meaningful (no asset selected, or no quantity
 * for a type that needs one).
 *
 * @param values - Current form values (strings).
 */
function buildPreviewTransaction(values: FormValues): Transaction | null {
    if (!values.ticker_id) return null

    const quantity = toNumber(values.quantity)
    const needsQuantity = values.type !== TransactionType.Fee
    if (needsQuantity && (quantity == null || quantity <= 0)) return null

    return {
        id: '__preview__',
        ticker_id: values.ticker_id as Ticker,
        type: values.type,
        buy_date: (values.buy_date
            ? toDbDate(values.buy_date)
            : nowDbDate()) as Transaction['buy_date'],
        quantity,
        transaction_price: toNumber(values.transaction_price),
        value: toNumber(values.value),
        fee: toNumber(values.fee) ?? 0,
        exchange_rate: toNumber(values.exchange_rate),
    }
}

function toPreviewSide(result: ReturnType<typeof processTransactions>): HoldingPreviewSide {
    return { quantity: result.totalQuantity, avgCost: result.avgCost }
}

/**
 * Computes a before/after preview of the selected asset's holding, comparing the
 * current state to the state that would result from applying the form values.
 * In edit mode the transaction being edited is excluded from "after" (and its
 * edited version is applied), while "before" keeps the current real state.
 * Returns `null` when the form does not describe a meaningful transaction yet.
 *
 * @param values - Current form values.
 * @param transactions - All transactions across every asset.
 * @param tickerData - Ticker metadata (used for currency and FX rates).
 * @param editingId - Id of the transaction being edited, or `null` when adding.
 */
export function computeHoldingPreview({
    values,
    transactions,
    tickerData,
    editingId,
}: {
    values: FormValues
    transactions: Transaction[]
    tickerData: TickerData[]
    editingId: string | null
}): HoldingPreview | null {
    const hypothetical = buildPreviewTransaction(values)
    if (!hypothetical) return null

    const ticker = hypothetical.ticker_id
    const currency = tickerData.find((td) => td.ticker === ticker)?.currency ?? Currency.EUR
    const rates = getCambioRates(tickerData)

    const forTicker = transactions.filter((tx) => tx.ticker_id === ticker)
    const withoutEdited = editingId ? forTicker.filter((tx) => tx.id !== editingId) : forTicker

    const before = processTransactions(forTicker, currency, rates)
    const after = processTransactions([...withoutEdited, hypothetical], currency, rates)

    return {
        currency,
        before: toPreviewSide(before),
        after: toPreviewSide(after),
    }
}
