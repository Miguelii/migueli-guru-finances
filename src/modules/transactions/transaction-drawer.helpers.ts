import type { Transaction } from '@/types/Transaction'
import type { FormValues } from './transaction-drawer'

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
