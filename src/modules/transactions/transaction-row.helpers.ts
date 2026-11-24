import type { Transaction } from '@/types/Transaction'

const LOCALE = 'pt-PT'

function toDate(buyDate: Transaction['buy_date']): Date {
    return new Date(buyDate.replace(' ', 'T'))
}

export function formatDayMonth(buyDate: Transaction['buy_date']): string {
    return toDate(buyDate).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })
}

export function formatTime(buyDate: Transaction['buy_date']): string {
    return toDate(buyDate).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(buyDate: Transaction['buy_date']): string {
    return toDate(buyDate).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * DOM id of a transaction row, used to scroll to it from a FIFO link.
 * @param id - Transaction id.
 */
export function getTransactionRowId(id: Transaction['id']): string {
    return `transaction-row-${id}`
}
