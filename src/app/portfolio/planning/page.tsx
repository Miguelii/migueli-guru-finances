import type { Metadata } from 'next'
import { searchParamsCache } from '@/lib/core/searchParams'
import { computePortfolioTotals } from '@/lib/portfolio/calculations'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import { HousePlannerCard } from '@/modules/planning/house-planner-card'
import { PlanningCard } from '@/modules/planning/planning-card'
import { PlanningTabs } from '@/modules/planning/planning-tabs'

export const metadata: Metadata = {
    title: 'Planning | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/planning'>

export default async function PlanningPage(props: Props) {
    const [{ holdings, transactions }, searchParams] = await Promise.all([
        getPortfolioData(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices
    const portfolioValueEur = computePortfolioTotals(holdings).currentValue

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <PlanningTabs
                house={
                    <HousePlannerCard
                        portfolioValueEur={portfolioValueEur}
                        hidePrices={hidePrices}
                    />
                }
                projection={
                    <PlanningCard
                        holdings={holdings}
                        transactions={transactions}
                        hidePrices={hidePrices}
                    />
                }
            />
        </main>
    )
}
