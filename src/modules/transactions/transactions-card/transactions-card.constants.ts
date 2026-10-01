import { TransactionType } from '@/types/Transaction'

export const TYPE_BADGE_VARIANT = {
    [TransactionType.Buy]: 'success',
    [TransactionType.Sell]: 'alert',
    [TransactionType.Reward]: 'secondary',
    [TransactionType.Fee]: 'outline',
} as const

export const TYPE_LABEL = {
    [TransactionType.Buy]: 'Buy',
    [TransactionType.Sell]: 'Sell',
    [TransactionType.Reward]: 'Reward',
    [TransactionType.Fee]: 'Fee',
} as const

// Desktop header labels, aligned with TRANSACTION_ROW_GRID_CLASS
export const TRANSACTION_COLUMNS = [
    { label: 'Date', align: 'left' },
    { label: 'Asset', align: 'left' },
    { label: 'Type', align: 'left' },
    { label: 'Quantity', align: 'left' },
    { label: 'Value', align: 'right' },
    { label: 'Fee', align: 'right' },
    { label: 'Capital gains tax', align: 'right' },
] as const

// Fixed card height: the transactions list scrolls inside instead of growing the page
export const TRANSACTIONS_CARD_HEIGHT_CLASS = 'h-160'
