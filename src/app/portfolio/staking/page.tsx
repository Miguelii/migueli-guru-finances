import type { Metadata } from 'next'
import { searchParamsCache } from '@/lib/core/searchParams'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import { StakingCard } from '@/modules/staking/staking-card'

export const metadata: Metadata = {
    title: 'Staking | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/staking'>

export default async function StakingPage(props: Props) {
    const [{ holdings }, searchParams] = await Promise.all([
        getPortfolioData(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <StakingCard holdings={holdings} hidePrices={hidePrices} />
        </main>
    )
}
