import { TransactionType } from '@/types/Transaction'

export const TRANSACTION_TYPE_ORDER = [
    TransactionType.Buy,
    TransactionType.Sell,
    TransactionType.Reward,
    TransactionType.Fee,
] as const
