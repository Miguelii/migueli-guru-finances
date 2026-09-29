import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types/Transaction'
import { getGoalProgress } from '@/components/goal-progress/goal-progress.helpers'
import { ProgressRing } from '@/components/goal-progress/progress-ring'

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
        <div className="flex items-center gap-4">
            <ProgressRing
                percentage={percentage}
                label={`${label} goal progress`}
                isComplete={isComplete}
            />
            <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                    className={cn('text-xl font-semibold tabular-nums tracking-tight', {
                        'blur-md select-none': hidePrices,
                    })}
                >
                    {formatCurrency(currentValue, currency)}
                </p>
                <p
                    className={cn('text-xs text-muted-foreground', {
                        'text-success': isComplete,
                        'blur-md select-none': hidePrices,
                    })}
                >
                    {isComplete ? 'Goal reached' : `${formatCurrency(remaining, currency)} to go`}
                </p>
            </div>
        </div>
    )
}
