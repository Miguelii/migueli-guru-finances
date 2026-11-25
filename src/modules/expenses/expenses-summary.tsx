import { formatCurrency, formatPercentage } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { BudgetTotals } from '@/modules/expenses/expenses.helpers'

type Props = {
    totals: BudgetTotals
    hidePrices: boolean
}

export function ExpensesSummary({ totals, hidePrices }: Props) {
    const isOverBudget = totals.leftoverEur < 0
    const blurClass = { 'blur-md select-none': hidePrices }

    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3">
            <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Monthly income
                </dt>
                <dd className={cn('text-lg font-semibold tabular-nums', blurClass)}>
                    {formatCurrency(totals.incomeEur, Currency.EUR)}
                </dd>
            </div>
            <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Monthly expenses
                </dt>
                <dd className={cn('text-lg font-semibold tabular-nums', blurClass)}>
                    {formatCurrency(totals.expensesEur, Currency.EUR)}
                </dd>
            </div>
            <div className="col-span-2 flex flex-col gap-1 md:col-span-1">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {isOverBudget ? 'Over budget' : 'Left over'}
                </dt>
                <dd
                    className={cn('text-2xl font-semibold tracking-tight tabular-nums', blurClass, {
                        'text-success': !isOverBudget,
                        'text-destructive': isOverBudget,
                    })}
                >
                    {formatCurrency(Math.abs(totals.leftoverEur), Currency.EUR)}
                </dd>
                <dd className="text-xs text-muted-foreground">
                    {isOverBudget
                        ? 'Expenses are above your income'
                        : `${formatPercentage(totals.leftoverRatio * 100)} of your income`}
                </dd>
            </div>
        </dl>
    )
}
