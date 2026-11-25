import type { BankBalanceSummary } from '@/types/BankConnection'
import type { HoldingSummary } from '@/types/Holding'
import type { CambioRates, TickerData, Transaction } from '@/types/Transaction'
import { GoalsCard } from '@/modules/dashboard/goals-card'
import { LatestTransactionCard } from '@/modules/dashboard/latest-transaction-card'
import { StakingCard } from '@/modules/staking/staking-card'
import { TopPerformersCard } from '@/modules/top-performers/top-performers-card'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    holdings: HoldingSummary[]
    bankBalance: BankBalanceSummary
    emergencyFundGoalEur: number | null
    hidePrices: boolean
}

// Side column of the dashboard
export function DashboardHighlights({
    transactions,
    tickerData,
    rates,
    holdings,
    bankBalance,
    emergencyFundGoalEur,
    hidePrices,
}: Props) {
    return (
        <aside aria-label="Highlights" className="flex min-w-0 flex-col gap-6">
            <LatestTransactionCard
                transactions={transactions}
                tickerData={tickerData}
                rates={rates}
                hidePrices={hidePrices}
            />
            <GoalsCard
                bankBalance={bankBalance}
                goal={emergencyFundGoalEur}
                hidePrices={hidePrices}
            />
            <TopPerformersCard holdings={holdings} hidePrices={hidePrices} />
            <StakingCard holdings={holdings} hidePrices={hidePrices} />
        </aside>
    )
}
