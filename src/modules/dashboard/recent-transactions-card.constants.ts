export const RECENT_TRANSACTIONS_COUNT = 5

export const TransactionDirection = {
    In: 'in',
    Out: 'out',
} as const

export type TransactionDirection = (typeof TransactionDirection)[keyof typeof TransactionDirection]
