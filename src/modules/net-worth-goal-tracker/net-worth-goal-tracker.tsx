import { Target } from 'lucide-react'
import { computePortfolioTotals } from '@/lib/portfolio/calculations'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency, TickerType } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'
import { DEFAULT_NET_WORTH_GOAL } from '@/modules/net-worth-goal-tracker/net-worth-goal-tracker.constants'
import { getNetWorthGoalProgress } from '@/modules/net-worth-goal-tracker/net-worth-goal-tracker.helpers'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
    goal?: number
}

const currency = Currency.EUR as const

type GoalProgressRowProps = {
    label: string
    currentValue: number
    goal: number
    hidePrices: boolean
}

const GoalProgressRow = ({ label, currentValue, goal, hidePrices }: GoalProgressRowProps) => {
    const { percentage, remaining, isComplete } = getNetWorthGoalProgress(currentValue, goal)

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

export function NetWorthGoalTracker({
    holdings,
    hidePrices,
    goal = DEFAULT_NET_WORTH_GOAL,
}: Props) {
    const nonCryptoHoldings = holdings.filter((h) => h.tickerType !== TickerType.Crypto)
    const { currentValue } = computePortfolioTotals(holdings)
    const { currentValue: currentValueNoCrypto } = computePortfolioTotals(nonCryptoHoldings)

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
            contentClassName="space-y-4 py-4"
        >
            <GoalProgressRow
                label="Net Worth"
                currentValue={currentValue}
                goal={goal}
                hidePrices={hidePrices}
            />
            <GoalProgressRow
                label="Net Worth (no crypto)"
                currentValue={currentValueNoCrypto}
                goal={goal}
                hidePrices={hidePrices}
            />
        </PortfolioCard>
    )
}
