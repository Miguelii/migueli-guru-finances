import { ExpenseCategory } from '@/types/Expense'

type CategoryMeta = {
    label: string
    // SVG fill for the chart
    color: string
    // Swatch class for lists and selects
    swatchClassName: string
}

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
    [ExpenseCategory.Housing]: {
        label: 'Housing',
        color: 'var(--color-expense-housing)',
        swatchClassName: 'bg-expense-housing',
    },
    [ExpenseCategory.Food]: {
        label: 'Food',
        color: 'var(--color-expense-food)',
        swatchClassName: 'bg-expense-food',
    },
    [ExpenseCategory.Transport]: {
        label: 'Transport',
        color: 'var(--color-expense-transport)',
        swatchClassName: 'bg-expense-transport',
    },
    [ExpenseCategory.Car]: {
        label: 'Car',
        color: 'var(--color-expense-car)',
        swatchClassName: 'bg-expense-car',
    },
    [ExpenseCategory.Bills]: {
        label: 'Bills & subscriptions',
        color: 'var(--color-expense-bills)',
        swatchClassName: 'bg-expense-bills',
    },
    [ExpenseCategory.Health]: {
        label: 'Health',
        color: 'var(--color-expense-health)',
        swatchClassName: 'bg-expense-health',
    },
    [ExpenseCategory.Leisure]: {
        label: 'Leisure',
        color: 'var(--color-expense-leisure)',
        swatchClassName: 'bg-expense-leisure',
    },
    [ExpenseCategory.Saving]: {
        label: 'Saving',
        color: 'var(--color-expense-saving)',
        swatchClassName: 'bg-expense-saving',
    },
    [ExpenseCategory.VacationFund]: {
        label: 'Vacation fund',
        color: 'var(--color-expense-vacation)',
        swatchClassName: 'bg-expense-vacation',
    },
    [ExpenseCategory.Investment]: {
        label: 'Investment',
        color: 'var(--color-expense-investment)',
        swatchClassName: 'bg-expense-investment',
    },
    [ExpenseCategory.GeneralExpenses]: {
        label: 'General expenses',
        color: 'var(--color-expense-general)',
        swatchClassName: 'bg-expense-general',
    },
    [ExpenseCategory.Other]: {
        label: 'Other',
        color: 'var(--color-expense-other)',
        swatchClassName: 'bg-expense-other',
    },
}

export const EXPENSE_CATEGORY_ORDER = Object.values(ExpenseCategory)

export const SANKEY_COLORS = {
    salary: 'var(--color-brand)',
    mealAllowance: 'var(--color-chart-1)',
    income: 'var(--color-chart-3)',
    leftover: 'var(--color-success)',
    shortfall: 'var(--color-destructive)',
} as const

export const SANKEY_NODE_WIDTH = 10

export const SANKEY_NODE_PADDING = 18

// Room for the labels outside the outermost columns
export const SANKEY_MARGIN = { top: 12, right: 150, bottom: 12, left: 130 } as const

export const SANKEY_MIN_HEIGHT_PX = 320

export const SANKEY_HEIGHT_PER_LEAF_PX = 44
