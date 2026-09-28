import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types/Transaction'
import { getGoalProgress } from '@/components/goal-progress/goal-progress.helpers'

type Props = {
    label: string
    currentValue: number
    goal: number
    currency: Currency
    hidePrices: boolean
}

export function GoalProgress({ label, currentValue, goal, currency, hidePrices }: Props) {
    const { percentage, remaining, isComplete } = getGoalProgress(currentValue, goal)

    return (
        <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p
                        className={cn('text-lg font-semibold tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(currentValue, currency)}
                    </p>
                </div>
                <p className="text-xs font-medium tabular-nums text-muted-foreground">
                    {percentage.toFixed(1)}%
                </p>
            </div>
            <progress
                aria-label={`${label} goal progress`}
                className="h-2 w-full overflow-hidden bg-muted accent-success"
                max={goal}
                value={(goal * percentage) / 100}
            />
            <p
                className={cn('text-xs text-muted-foreground', {
                    'blur-md select-none': hidePrices,
                })}
            >
                {isComplete
                    ? 'Goal reached'
                    : `${formatCurrency(remaining, currency)} remaining to reach your goal`}
            </p>
        </div>
    )
}
