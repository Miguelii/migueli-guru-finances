import { ExpenseCategory } from '@/types/Expense'
import type { ExpenseFormValues } from '@/modules/expenses/add-expense-drawer/add-expense-drawer.helpers'
import {
    EXPENSE_CATEGORY_META,
    EXPENSE_CATEGORY_ORDER,
} from '@/modules/expenses/expenses.constants'

export const EXPENSE_NAME_MAX_LENGTH = 40

export const CATEGORY_ITEMS = EXPENSE_CATEGORY_ORDER.map((category) => ({
    value: category,
    label: EXPENSE_CATEGORY_META[category].label,
}))

export const EMPTY_EXPENSE_VALUES: ExpenseFormValues = {
    name: '',
    category: ExpenseCategory.Housing,
    amount: '',
}
