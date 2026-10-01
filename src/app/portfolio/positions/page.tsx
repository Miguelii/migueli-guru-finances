import type { Metadata } from 'next'
import { searchParamsCache } from '@/lib/core/searchParams'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import { PositionsExplorer } from '@/modules/positions/positions-explorer'

export const metadata: Metadata = {
    title: 'Positions | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/positions'>

export default async function PositionsPage(props: Props) {
    const [{ holdings }, searchParams] = await Promise.all([
        getPortfolioData(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <PositionsExplorer holdings={holdings} hidePrices={hidePrices} />
        </main>
    )
}
