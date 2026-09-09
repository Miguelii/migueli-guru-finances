import { Target } from 'lucide-react'
import { computePortfolioTotals } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'
import { DEFAULT_NET_WORTH_GOAL } from '@/modules/summary/net-worth-goal-tracker.constants'
import { getNetWorthGoalProgress } from '@/modules/summary/net-worth-goal-tracker.helpers'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
    goal?: number
}

const currency = Currency.EUR as const

export function NetWorthGoalTracker({
    holdings,
    hidePrices,
    goal = DEFAULT_NET_WORTH_GOAL,
}: Props) {
    const { currentValue } = computePortfolioTotals(holdings)
    const { percentage, remaining, isComplete } = getNetWorthGoalProgress(currentValue, goal)

    return (
        <PortfolioCard
            cardId="net-worth-goal"
            title="Net Worth Goal"
            openHeightClassName="h-auto"
            actions={
                <div className="flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Target {formatCurrency(goal, currency)}</span>
                </div>
            }
            contentClassName="space-y-3 py-4"
        >
            <div className="flex items-baseline justify-between gap-4">
                <p
                    className={cn('text-lg font-semibold tabular-nums', {
                        'blur-md select-none': hidePrices,
                    })}
                >
                    {formatCurrency(currentValue, currency)}
                </p>
                <p className="text-xs font-medium tabular-nums text-muted-foreground">
                    {percentage.toFixed(1)}%
                </p>
            </div>
            <progress
                aria-label="Net worth goal progress"
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
        </PortfolioCard>
    )
}
