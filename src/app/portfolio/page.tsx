import { createCaller } from '@/_bff/trpc/caller'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import type { Metadata } from 'next'
import { searchParamsCache } from '@/lib/core/searchParams'
import { SNAPSHOT_TIME_ZONE } from '@/lib/constants/portfolio-snapshots'
import { computePortfolioTotals } from '@/lib/portfolio/calculations'
import { buildInvestedTimeline } from '@/lib/portfolio/invested-timeline'
import { toDateKey } from '@/lib/portfolio/portfolio-snapshots'
import { getIsDev } from '@/lib/utils/index.server'
import { Card } from '@/components/ui/card'
import { AllocationOverviewCard } from '@/modules/dashboard/allocation-overview-card'
import { DashboardGreeting } from '@/modules/dashboard/dashboard-greeting'
import { withLiveSnapshot } from '@/modules/dashboard/dashboard.helpers'
import { GoalsCard } from '@/modules/dashboard/goals-card'
import { KpiCards } from '@/modules/dashboard/kpi-cards'
import { LatestTransactionCard } from '@/modules/dashboard/latest-transaction-card'
import { PerformanceChart } from '@/modules/dashboard/performance-chart'
import { RecentTransactionsCard } from '@/modules/dashboard/recent-transactions-card'
import { AssetClassCards } from '@/modules/summary/asset-class-cards'
import { TopPerformersCard } from '@/modules/top-performers/top-performers-card'

export const metadata: Metadata = {
    title: 'Portfolio | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio'>

export default async function PortfolioPage(props: Props) {
    const trpc = await createCaller()

    const [{ holdings, transactions, data, rates }, snapshots, bankBalance, user, searchParams] =
        await Promise.all([
            getPortfolioData(),
            trpc.snapshots.getAll(),
            trpc.bank.get(),
            trpc.auth.me(),
            searchParamsCache.parse(props.searchParams),
        ])

    const hidePrices = searchParams.hide_prices
    const totals = computePortfolioTotals(holdings)
    const investedPoints = buildInvestedTimeline(transactions, data, rates)
    const valuePoints = withLiveSnapshot(snapshots, {
        date: toDateKey(new Date(), SNAPSHOT_TIME_ZONE),
        valueEur: totals.currentValue,
        investedEur: totals.totalInvested,
        realizedGlEur: totals.totalRealized,
    })

    return (
        <main
            className="mb-24 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
            id="main"
        >
            <div className="flex min-w-0 flex-col gap-6">
                <DashboardGreeting name={user.name} />

                <KpiCards
                    totals={totals}
                    valuePoints={valuePoints}
                    investedPoints={investedPoints}
                    hidePrices={hidePrices}
                />

                <AssetClassCards holdings={holdings} hidePrices={hidePrices} />

                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                    <Card aria-labelledby="performance-title" className="min-w-0 gap-4 p-5">
                        <PerformanceChart
                            points={valuePoints}
                            hidePrices={hidePrices}
                            isDev={getIsDev()}
                        />
                    </Card>
                    <AllocationOverviewCard
                        holdings={holdings}
                        totals={totals}
                        hidePrices={hidePrices}
                    />
                </div>

                <RecentTransactionsCard
                    transactions={transactions}
                    tickerData={data}
                    rates={rates}
                    hidePrices={hidePrices}
                />
            </div>

            <aside aria-label="Highlights" className="flex min-w-0 flex-col gap-6">
                <LatestTransactionCard
                    transactions={transactions}
                    tickerData={data}
                    rates={rates}
                    hidePrices={hidePrices}
                />
                <GoalsCard bankBalance={bankBalance} hidePrices={hidePrices} />
                <TopPerformersCard holdings={holdings} hidePrices={hidePrices} />
            </aside>
        </main>
    )
}
