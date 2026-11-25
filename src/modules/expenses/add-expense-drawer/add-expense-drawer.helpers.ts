import { parseDecimalInput } from '@/lib/utils'
import type { ExpenseCategory } from '@/types/Expense'

export type ExpenseFormValues = {
    name: string
    category: ExpenseCategory
    amount: string
}

/**
 * Converts the form strings into the `settings.addExpense` payload, or `null` when the
 * amount is missing, invalid or zero.
 *
 * @param values - Current form values.
 */
export function toExpensePayload(values: ExpenseFormValues) {
    const amountEur = parseDecimalInput(values.amount)
    if (amountEur === null || amountEur <= 0) return null

    return { name: values.name.trim(), category: values.category, amountEur }
}
