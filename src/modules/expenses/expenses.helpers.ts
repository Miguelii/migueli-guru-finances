import type { Expense, ExpenseCategory } from '@/types/Expense'
import {
    EXPENSE_CATEGORY_META,
    EXPENSE_CATEGORY_ORDER,
    SANKEY_COLORS,
    SANKEY_HEIGHT_PER_LEAF_PX,
    SANKEY_MIN_HEIGHT_PX,
} from '@/modules/expenses/expenses.constants'

export type ExpenseGroup = {
    category: ExpenseCategory
    totalEur: number
    expenses: Expense[]
}

export type BudgetTotals = {
    incomeEur: number
    expensesEur: number
    // Negative when the expenses are above the income
    leftoverEur: number
    leftoverRatio: number
}

export type SankeyNodeMeta = {
    name: string
    color: string
    valueEur: number
    isSource: boolean
}

export type SankeyLinkMeta = {
    source: number
    target: number
    value: number
    color: string
}

export type ExpensesSankey = {
    nodes: SankeyNodeMeta[]
    links: SankeyLinkMeta[]
    heightPx: number
}

type Income = {
    netSalaryEur: number
    mealAllowanceEur: number
}

/**
 * Expenses grouped by category in the fixed category order, biggest expense first inside
 * each group. Categories without expenses are left out.
 *
 * @param expenses - The user's monthly expenses.
 */
export function groupExpensesByCategory(expenses: Expense[]): ExpenseGroup[] {
    return EXPENSE_CATEGORY_ORDER.flatMap((category) => {
        const inCategory = expenses
            .filter((expense) => expense.category === category)
            .toSorted((a, b) => b.amountEur - a.amountEur)

        if (inCategory.length === 0) return []

        return [
            {
                category,
                totalEur: inCategory.reduce((sum, expense) => sum + expense.amountEur, 0),
                expenses: inCategory,
            },
        ]
    })
}

export function getBudgetTotals(income: Income, expenses: Expense[]): BudgetTotals {
    const incomeEur = income.netSalaryEur + income.mealAllowanceEur
    const expensesEur = expenses.reduce((sum, expense) => sum + expense.amountEur, 0)
    const leftoverEur = incomeEur - expensesEur

    return {
        incomeEur,
        expensesEur,
        leftoverEur,
        leftoverRatio: incomeEur > 0 ? leftoverEur / incomeEur : 0,
    }
}

/**
 * Builds the Sankey flow: income sources → Income → categories → each expense, plus a
 * "Left over" branch out of Income. When expenses are above the income a "Shortfall"
 * source fills the gap so every flow still balances.
 *
 * @param income - Monthly net salary and meal allowance.
 * @param expenses - The user's monthly expenses.
 */
export function buildExpensesSankey(income: Income, expenses: Expense[]): ExpensesSankey {
    const totals = getBudgetTotals(income, expenses)
    const nodes: SankeyNodeMeta[] = []
    const links: SankeyLinkMeta[] = []

    const addNode = (node: SankeyNodeMeta) => nodes.push(node) - 1
    const incomeSources = [
        { name: 'Net salary', valueEur: income.netSalaryEur, color: SANKEY_COLORS.salary },
        {
            name: 'Meal allowance',
            valueEur: income.mealAllowanceEur,
            color: SANKEY_COLORS.mealAllowance,
        },
        {
            name: 'Shortfall',
            valueEur: Math.max(0, -totals.leftoverEur),
            color: SANKEY_COLORS.shortfall,
        },
    ].filter((source) => source.valueEur > 0)

    const sourceIndexes = incomeSources.map((source) => addNode({ ...source, isSource: true }))
    const incomeIndex = addNode({
        name: 'Income',
        valueEur: Math.max(totals.incomeEur, totals.expensesEur),
        color: SANKEY_COLORS.income,
        isSource: false,
    })

    sourceIndexes.forEach((sourceIndex) => {
        const source = nodes[sourceIndex]!
        links.push({
            source: sourceIndex,
            target: incomeIndex,
            value: source.valueEur,
            color: source.color,
        })
    })

    let leafCount = 0

    for (const group of groupExpensesByCategory(expenses)) {
        const meta = EXPENSE_CATEGORY_META[group.category]
        const categoryIndex = addNode({
            name: meta.label,
            valueEur: group.totalEur,
            color: meta.color,
            isSource: false,
        })
        links.push({
            source: incomeIndex,
            target: categoryIndex,
            value: group.totalEur,
            color: meta.color,
        })

        for (const expense of group.expenses) {
            const expenseIndex = addNode({
                name: expense.name,
                valueEur: expense.amountEur,
                color: meta.color,
                isSource: false,
            })
            links.push({
                source: categoryIndex,
                target: expenseIndex,
                value: expense.amountEur,
                color: meta.color,
            })
            leafCount++
        }
    }

    if (totals.leftoverEur > 0) {
        const leftoverIndex = addNode({
            name: 'Left over',
            valueEur: totals.leftoverEur,
            color: SANKEY_COLORS.leftover,
            isSource: false,
        })
        links.push({
            source: incomeIndex,
            target: leftoverIndex,
            value: totals.leftoverEur,
            color: SANKEY_COLORS.leftover,
        })
        leafCount++
    }

    return {
        nodes,
        links,
        heightPx: Math.max(SANKEY_MIN_HEIGHT_PX, leafCount * SANKEY_HEIGHT_PER_LEAF_PX),
    }
}

/**
 * One-sentence description of the flow for screen readers (the chart is an image to them).
 *
 * @param totals - Monthly income, expenses and leftover.
 * @param groups - Expenses grouped by category.
 */
export function getSankeySummary(totals: BudgetTotals, groups: ExpenseGroup[]): string {
    const categories = groups
        .map(
            (group) =>
                `${EXPENSE_CATEGORY_META[group.category].label} ${Math.round(group.totalEur)} €`
        )
        .join(', ')
    const balance =
        totals.leftoverEur >= 0
            ? `${Math.round(totals.leftoverEur)} € left over`
            : `${Math.round(-totals.leftoverEur)} € over budget`

    return `Monthly income of ${Math.round(totals.incomeEur)} € split into ${categories || 'no expenses'}, with ${balance}.`
}
