import { createCaller } from '@/_bff/trpc/caller'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import type { Metadata } from 'next'
import { searchParamsCache } from '@/lib/core/searchParams'
import { NetWorthHero } from '@/modules/net-worth-hero/net-worth-hero'
import { AssetClassCards } from '@/modules/summary/asset-class-cards'
import { AllocationCardWithChart } from '@/modules/allocation-chart/allocation-card-with-chart'
import { TopPerformersCard } from '@/modules/top-performers/top-performers-card'
import { NetWorthGoalTracker } from '@/modules/net-worth-goal-tracker/net-worth-goal-tracker'

export const metadata: Metadata = {
    title: 'Portfolio | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio'>

export default async function PortfolioPage(props: Props) {
    const trpc = await createCaller()

    const [{ holdings, transactions, data, rates }, snapshots, searchParams] = await Promise.all([
        getPortfolioData(),
        trpc.snapshots.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <AssetClassCards holdings={holdings} hidePrices={hidePrices} />

            <NetWorthHero
                holdings={holdings}
                transactions={transactions}
                tickerData={data}
                rates={rates}
                snapshots={snapshots}
                hidePrices={hidePrices}
            />

            <AllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />

            <TopPerformersCard holdings={holdings} hidePrices={hidePrices} />
            <NetWorthGoalTracker holdings={holdings} hidePrices={hidePrices} />
        </main>
    )
}
