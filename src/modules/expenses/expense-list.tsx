'use client'

import { Loader2Icon, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { trpcClient } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { Expense } from '@/types/Expense'
import { EXPENSE_CATEGORY_META } from '@/modules/expenses/expenses.constants'
import type { ExpenseGroup } from '@/modules/expenses/expenses.helpers'

type Props = {
    groups: ExpenseGroup[]
    hidePrices: boolean
}

export function ExpenseList({ groups, hidePrices }: Props) {
    const router = useRouter()
    const blurClass = { 'blur-sm select-none': hidePrices }

    const addExpense = trpcClient.settings.addExpense.useMutation({
        onSuccess: () => router.refresh(),
        onError: (error) => toast.error(`Could not restore the expense: ${error.message}`),
    })

    const removeExpense = trpcClient.settings.removeExpense.useMutation({
        onError: (error) => toast.error(`An error occurred: ${error.message}`),
    })

    // Removing is quick to undo, so it skips a confirmation and offers Undo instead
    function onRemove(expense: Expense) {
        removeExpense.mutate(
            { id: expense.id },
            {
                onSuccess: () => {
                    router.refresh()
                    toast.success(`${expense.name} removed`, {
                        action: {
                            label: 'Undo',
                            onClick: () =>
                                addExpense.mutate({
                                    name: expense.name,
                                    amountEur: expense.amountEur,
                                    category: expense.category,
                                }),
                        },
                    })
                },
            }
        )
    }

    return (
        <div className="flex flex-col gap-5">
            {groups.map((group) => {
                const meta = EXPENSE_CATEGORY_META[group.category]

                return (
                    <section
                        key={group.category}
                        aria-labelledby={`expenses-${group.category}`}
                        className="flex flex-col"
                    >
                        <header className="flex items-center justify-between gap-3 border-b pb-2">
                            <h3
                                id={`expenses-${group.category}`}
                                className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn('size-2.5 rounded-full', meta.swatchClassName)}
                                />
                                {meta.label}
                            </h3>
                            <span
                                className={cn(
                                    'text-xs text-muted-foreground tabular-nums',
                                    blurClass
                                )}
                            >
                                {formatCurrency(group.totalEur, Currency.EUR)}
                            </span>
                        </header>
                        <ul className="flex flex-col divide-y">
                            {group.expenses.map((expense) => {
                                const isRemoving =
                                    removeExpense.isPending &&
                                    removeExpense.variables?.id === expense.id

                                return (
                                    <li
                                        key={expense.id}
                                        className="flex min-h-12 items-center justify-between gap-3 py-1.5"
                                    >
                                        <span className="min-w-0 truncate text-sm">
                                            {expense.name}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-1">
                                            <span
                                                className={cn(
                                                    'text-sm font-medium tabular-nums',
                                                    blurClass
                                                )}
                                            >
                                                {formatCurrency(expense.amountEur, Currency.EUR)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Remove ${expense.name}`}
                                                disabled={isRemoving}
                                                onClick={() => onRemove(expense)}
                                                className="size-10 cursor-pointer text-muted-foreground hover:text-destructive md:size-8"
                                            >
                                                {isRemoving ? (
                                                    <Loader2Icon className="animate-spin" />
                                                ) : (
                                                    <Trash2 />
                                                )}
                                            </Button>
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                )
            })}
        </div>
    )
}
