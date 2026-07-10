import { TransactionType } from '@/types/Transaction'
import { z } from 'zod'

const numericOptional = z.number().nonnegative().optional()

export const createTransactionSchema = z.object({
    ticker_id: z.string().trim().min(1).max(15),
    type: z.enum(TransactionType),
    buy_date: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u),
    quantity: numericOptional,
    transaction_price: numericOptional,
    value: numericOptional,
    fee: z.number().nonnegative(),
    exchange_rate: z.number().positive().optional(),
})

export const updateTransactionSchema = createTransactionSchema.extend({
    id: z.string().min(1),
})

export const deleteTransactionSchema = z.object({
    id: z.string().min(1),
})

export type CreateTransactionProps = z.infer<typeof createTransactionSchema>
export type UpdateTransactionProps = z.infer<typeof updateTransactionSchema>
