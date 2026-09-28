import { createCaller } from '@/_bff/trpc/caller'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import type { Metadata } from 'next'
import { PortfolioSummaryCards } from '@/modules/summary/portfolio-summary-cards'
import { searchParamsCache } from '@/lib/core/searchParams'
import { AllocationCardWithChart } from '@/modules/allocation-chart/allocation-card-with-chart'
import { TypeAllocationCardWithChart } from '@/modules/type-allocation-chart/type-allocation-card-with-chart'
import { NetWorthGoalTracker } from '@/modules/net-worth-goal-tracker/net-worth-goal-tracker'
import { EmergencyFundCard } from '@/modules/emergency-fund/emergency-fund-card'

export const metadata: Metadata = {
    title: 'Portfolio | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio'>

export default async function PortfolioPage(props: Props) {
    const trpc = await createCaller()

    const [{ holdings }, bankBalance, searchParams] = await Promise.all([
        getPortfolioData(),
        trpc.bank.get(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <PortfolioSummaryCards holdings={holdings} hidePrices={hidePrices} />

            <EmergencyFundCard summary={bankBalance} hidePrices={hidePrices} />

            <NetWorthGoalTracker holdings={holdings} hidePrices={hidePrices} />

            <section className="flex flex-col items-start gap-6 lg:flex-row">
                <AllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />
                <TypeAllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />
            </section>
        </main>
    )
}
