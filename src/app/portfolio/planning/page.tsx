import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { searchParamsCache } from '@/lib/core/searchParams'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import { PlanningCard } from '@/modules/planning/planning-card'

export const metadata: Metadata = {
    title: 'Planning | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/planning'>

export default async function PlanningPage(props: Props) {
    const trpc = await createCaller()

    const [{ holdings, transactions, data, rates }, snapshots, searchParams] = await Promise.all([
        getPortfolioData(),
        trpc.snapshots.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <PlanningCard
                holdings={holdings}
                transactions={transactions}
                tickerData={data}
                rates={rates}
                snapshots={snapshots}
                hidePrices={hidePrices}
            />
        </main>
    )
}
