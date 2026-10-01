import { createCaller } from '@/_bff/trpc/caller'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import type { Metadata } from 'next'
import { searchParamsCache } from '@/lib/core/searchParams'
import { NetWorthHero } from '@/modules/net-worth-hero/net-worth-hero'
import { AssetClassCards } from '@/modules/summary/asset-class-cards'
import { AllocationCardWithChart } from '@/modules/allocation-chart/allocation-card-with-chart'
import { TopPerformersCard } from '@/modules/top-performers/top-performers-card'
import { NetWorthGoalTracker } from '@/modules/net-worth-goal-tracker/net-worth-goal-tracker'
import { EmergencyFundCard } from '@/modules/emergency-fund/emergency-fund-card'
import { StakingCard } from '@/modules/staking/staking-card'

export const metadata: Metadata = {
    title: 'Portfolio | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio'>

export default async function PortfolioPage(props: Props) {
    const trpc = await createCaller()

    const [{ holdings, transactions, data, rates }, bankBalance, searchParams] = await Promise.all([
        getPortfolioData(),
        trpc.bank.get(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <NetWorthHero
                holdings={holdings}
                transactions={transactions}
                tickerData={data}
                rates={rates}
                hidePrices={hidePrices}
            />

            <AssetClassCards holdings={holdings} hidePrices={hidePrices} />

            <AllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />

            <section className="flex flex-col items-start gap-6 lg:flex-row">
                <TopPerformersCard holdings={holdings} hidePrices={hidePrices} />
                <StakingCard holdings={holdings} hidePrices={hidePrices} />
            </section>

            <section className="flex flex-col items-start gap-6 xl:flex-row">
                <NetWorthGoalTracker holdings={holdings} hidePrices={hidePrices} />
                <EmergencyFundCard summary={bankBalance} hidePrices={hidePrices} />
            </section>
        </main>
    )
}
