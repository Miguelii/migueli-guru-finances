import { createCaller } from '@/_bff/trpc/caller'
import { aggregateHoldings } from '@/lib/calculations'
import type { Metadata } from 'next'
import { PortfolioSummaryCards } from '@/modules/summary/portfolio-summary-cards'
import { searchParamsCache } from '@/lib/searchParams'
import { getCambioRates, getLatestUpdate } from '@/lib/utils'
import { RefreshApp } from '@/modules/dashboard-actions/refresh-app'
import { PortfolioExport } from '@/modules/portfolio-export/portfolio-export'
import { AllocationCardWithChart } from '@/modules/allocation-chart/allocation-card-with-chart'
import { TypeAllocationCardWithChart } from '@/modules/type-allocation-chart/type-allocation-card-with-chart'
import { NetWorthGoalTracker } from '@/modules/net-worth-goal-tracker/net-worth-goal-tracker'

export const metadata: Metadata = {
    title: 'Portfolio | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio'>

export default async function PortfolioPage(props: Props) {
    const trpc = await createCaller()

    const [transactions, data, searchParams] = await Promise.all([
        trpc.transactions.getAll(),
        trpc.assets.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    const rates = getCambioRates(data)

    const holdings = aggregateHoldings(transactions, data, rates)

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <span className="text-xs text-muted-foreground">
                    Last Update: {getLatestUpdate(data)}
                </span>
                <div className="flex flex-col md:flex-row gap-5 md:gap-2 w-full md:w-fit">
                    <RefreshApp />
                    <PortfolioExport holdings={holdings} />
                </div>
            </div>

            <PortfolioSummaryCards holdings={holdings} hidePrices={hidePrices} />

            <NetWorthGoalTracker holdings={holdings} hidePrices={hidePrices} />

            <section className="flex flex-col items-start gap-6 lg:flex-row">
                <AllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />
                <TypeAllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />
            </section>
        </main>
    )
}
