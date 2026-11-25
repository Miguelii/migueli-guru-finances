import { ExpenseCategory } from '@/types/Expense'
import { z } from 'zod'

export const updateSettingsSchema = z.object({
    netMonthlySalaryEur: z.number().nonnegative().max(1_000_000),
    emergencyFundGoalEur: z.number().positive().max(100_000_000),
})

export const addExpenseSchema = z.object({
    name: z.string().trim().min(1).max(40),
    amountEur: z.number().positive().max(1_000_000),
    category: z.enum(ExpenseCategory),
})

// Shape of each item stored in the `monthly_expenses` JSON column
const storedExpenseSchema = addExpenseSchema.extend({
    id: z.string().min(1),
})

// The JSON column is not enforced by the database: invalid items are dropped, not fatal
export const storedExpensesSchema = z
    .array(storedExpenseSchema.nullable().catch(null))
    .catch([])
    .transform((items) => items.filter((item) => item !== null))

export const removeExpenseSchema = z.object({
    id: z.string().min(1),
})

export type UpdateSettingsProps = z.infer<typeof updateSettingsSchema>
export type AddExpenseProps = z.infer<typeof addExpenseSchema>
