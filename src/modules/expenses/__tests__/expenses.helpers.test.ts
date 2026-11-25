import { describe, expect, it } from 'vitest'
import { ExpenseCategory, type Expense } from '@/types/Expense'
import {
    buildExpensesSankey,
    getBudgetTotals,
    getSankeySummary,
    groupExpensesByCategory,
} from '@/modules/expenses/expenses.helpers'

const expense = (name: string, amountEur: number, category: ExpenseCategory): Expense => ({
    id: name,
    name,
    amountEur,
    category,
})

const EXPENSES = [
    expense('Netflix', 13, ExpenseCategory.Bills),
    expense('Rent', 750, ExpenseCategory.Housing),
    expense('Electricity', 60, ExpenseCategory.Bills),
]

const INCOME = { netSalaryEur: 2500, mealAllowanceEur: 200 }

describe('groupExpensesByCategory', () => {
    it('follows the category order and sorts each group by amount', () => {
        const groups = groupExpensesByCategory(EXPENSES)

        expect(groups.map((group) => group.category)).toEqual([
            ExpenseCategory.Housing,
            ExpenseCategory.Bills,
        ])
        expect(groups[1]?.expenses.map((item) => item.name)).toEqual(['Electricity', 'Netflix'])
        expect(groups[1]?.totalEur).toBe(73)
    })
})

describe('getBudgetTotals', () => {
    it('adds both incomes and works out the leftover', () => {
        expect(getBudgetTotals(INCOME, EXPENSES)).toEqual({
            incomeEur: 2700,
            expensesEur: 823,
            leftoverEur: 1877,
            leftoverRatio: 1877 / 2700,
        })
    })

    it('has no ratio without income', () => {
        expect(getBudgetTotals({ netSalaryEur: 0, mealAllowanceEur: 0 }, []).leftoverRatio).toBe(0)
    })
})

describe('buildExpensesSankey', () => {
    it('links sources to income, income to categories and categories to expenses', () => {
        const { nodes, links } = buildExpensesSankey(INCOME, EXPENSES)

        expect(nodes.map((node) => node.name)).toEqual([
            'Net salary',
            'Meal allowance',
            'Income',
            'Housing',
            'Rent',
            'Bills & subscriptions',
            'Electricity',
            'Netflix',
            'Left over',
        ])
        // Every node except the sources and leaves balances its inflow and outflow
        const inflow = (index: number) =>
            links.filter((link) => link.target === index).reduce((sum, l) => sum + l.value, 0)
        const outflow = (index: number) =>
            links.filter((link) => link.source === index).reduce((sum, l) => sum + l.value, 0)

        expect(inflow(2)).toBe(2700)
        expect(outflow(2)).toBe(2700)
        expect(inflow(5)).toBe(outflow(5))
    })

    it('adds a shortfall source when expenses exceed the income', () => {
        const { nodes, links } = buildExpensesSankey(
            { netSalaryEur: 500, mealAllowanceEur: 0 },
            EXPENSES
        )

        expect(nodes.map((node) => node.name)).toContain('Shortfall')
        expect(nodes.map((node) => node.name)).not.toContain('Left over')
        expect(links.find((link) => nodes[link.source]?.name === 'Shortfall')?.value).toBe(323)
    })

    it('grows with the number of leaves but never below the minimum height', () => {
        expect(buildExpensesSankey(INCOME, []).heightPx).toBe(320)
    })
})

describe('getSankeySummary', () => {
    it('describes the flow in one sentence', () => {
        const totals = getBudgetTotals(INCOME, EXPENSES)

        expect(getSankeySummary(totals, groupExpensesByCategory(EXPENSES))).toBe(
            'Monthly income of 2700 € split into Housing 750 €, Bills & subscriptions 73 €, with 1877 € left over.'
        )
    })
})
