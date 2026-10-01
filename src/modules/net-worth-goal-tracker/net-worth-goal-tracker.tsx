import { Target } from 'lucide-react'
import { GoalProgress } from '@/components/goal-progress/goal-progress'
import { computePortfolioTotals } from '@/lib/portfolio/calculations'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { Currency, TickerType } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'
import { DEFAULT_NET_WORTH_GOAL } from '@/modules/net-worth-goal-tracker/net-worth-goal-tracker.constants'
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
    const nonCryptoHoldings = holdings.filter((h) => h.tickerType !== TickerType.Crypto)
    const { currentValue } = computePortfolioTotals(holdings)
    const { currentValue: currentValueNoCrypto } = computePortfolioTotals(nonCryptoHoldings)

    return (
        <PortfolioCard
            cardId="net-worth-goal"
            title="Net Worth Goal"
            openHeightClassName="h-full shrink-0 w-full xl:w-[50%]"
            actions={
                <div className="flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>Target {formatCurrency(goal, currency)}</span>
                </div>
            }
            contentClassName="grid gap-6 py-4 sm:grid-cols-2"
        >
            <GoalProgress
                label="Net Worth"
                currentValue={currentValue}
                goal={goal}
                currency={currency}
                hidePrices={hidePrices}
            />
            <GoalProgress
                label="Net Worth (no crypto)"
                currentValue={currentValueNoCrypto}
                goal={goal}
                currency={currency}
                hidePrices={hidePrices}
            />
        </PortfolioCard>
    )
}
