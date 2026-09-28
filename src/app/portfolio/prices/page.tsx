import { PricesSummaryCards } from '@/modules/assets/prices-summay-cards'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import type { Metadata } from 'next/types'

export const metadata: Metadata = {
    title: 'Assets | Migueli Guru Finances',
}

export default async function PortfolioPage() {
    const { data } = await getPortfolioData()

    return (
        <main className="flex flex-col gap-6 mb-24" id="main">
            <PricesSummaryCards data={data} />
        </main>
    )
}
