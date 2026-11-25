'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useHasOpened } from '@/hooks/use-has-opened'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { SETTINGS_ROUTE_PATH } from '@/lib/constants'
import type { Expense } from '@/types/Expense'
import { LazyAddExpenseDrawer } from '@/modules/expenses/expenses-card.lazy'
import { ExpenseList } from '@/modules/expenses/expense-list'
import { ExpensesSankey } from '@/modules/expenses/expenses-sankey'
import { ExpensesSummary } from '@/modules/expenses/expenses-summary'
import {
    buildExpensesSankey,
    getBudgetTotals,
    getSankeySummary,
    groupExpensesByCategory,
} from '@/modules/expenses/expenses.helpers'

type Props = {
    netSalaryEur: number | null
    mealAllowanceEur: number
    expenses: Expense[]
    hidePrices: boolean
}

export function ExpensesCard({ netSalaryEur, mealAllowanceEur, expenses, hidePrices }: Props) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const hasOpenedDrawer = useHasOpened(isDrawerOpen)

    const income = { netSalaryEur: netSalaryEur ?? 0, mealAllowanceEur }
    const totals = getBudgetTotals(income, expenses)
    const groups = groupExpensesByCategory(expenses)
    const hasIncome = totals.incomeEur > 0
    const hasExpenses = expenses.length > 0

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Where your salary goes</CardTitle>
                    <CardDescription>Your monthly income and recurring expenses.</CardDescription>
                    <CardAction>
                        <Button
                            size="sm"
                            onClick={() => setIsDrawerOpen(true)}
                            className="h-9 cursor-pointer gap-1 px-3 md:h-8"
                        >
                            <Plus className="size-4" />
                            Add expense
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    {netSalaryEur === null && (
                        <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                            Your net salary is not set, so the income only counts the meal
                            allowance.{' '}
                            <Link
                                href={SETTINGS_ROUTE_PATH}
                                className="font-medium text-brand underline-offset-4 hover:underline"
                            >
                                Set it in Settings
                            </Link>
                        </p>
                    )}

                    <ExpensesSummary totals={totals} hidePrices={hidePrices} />

                    {hasIncome || hasExpenses ? (
                        <ExpensesSankey
                            sankey={buildExpensesSankey(income, expenses)}
                            summary={getSankeySummary(totals, groups)}
                            hidePrices={hidePrices}
                        />
                    ) : null}

                    {hasExpenses ? (
                        <ExpenseList groups={groups} hidePrices={hidePrices} />
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <p className="text-sm font-medium">No expenses yet</p>
                            <p className="text-xs text-muted-foreground">
                                Add your rent, groceries and subscriptions to see where your salary
                                goes.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {hasOpenedDrawer && (
                <LazyAddExpenseDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
            )}
        </>
    )
}
