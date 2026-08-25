import type { HoldingSummary } from '@/types/Holding'
import { AllocationChart } from '@/modules/allocation-chart/allocation-chart'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function AllocationCardWithChart({ holdings, hidePrices }: Props) {
    return (
        <PortfolioCard cardId="allocation" title="Allocation">
            <div className="flex items-center justify-center">
                <AllocationChart
                    holdings={holdings}
                    hidePrices={hidePrices}
                    chartLabel="Total Net Worth"
                />
            </div>
        </PortfolioCard>
    )
}
