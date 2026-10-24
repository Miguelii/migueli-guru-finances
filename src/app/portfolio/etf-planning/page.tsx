import type { Metadata } from 'next'
import { searchParamsCache } from '@/lib/core/searchParams'
import { buildUnheldHoldings } from '@/lib/portfolio/calculations'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import { EtfPlanningCard } from '@/modules/etf-planning/etf-planning-card'

export const metadata: Metadata = {
    title: 'ETF Planning | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/etf-planning'>

export default async function EtfPlanningPage(props: Props) {
    const [{ holdings, data, rates }, searchParams] = await Promise.all([
        getPortfolioData(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices
    const unheldHoldings = buildUnheldHoldings(holdings, data, rates)

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <EtfPlanningCard
                holdings={holdings}
                unheldHoldings={unheldHoldings}
                hidePrices={hidePrices}
            />
        </main>
    )
}
