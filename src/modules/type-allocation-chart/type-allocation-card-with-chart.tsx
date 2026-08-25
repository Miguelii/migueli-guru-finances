import type { HoldingSummary } from '@/types/Holding'
import { TypeAllocationChart } from '@/modules/type-allocation-chart/type-allocation-chart'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function TypeAllocationCardWithChart({ holdings, hidePrices }: Props) {
    return (
        <PortfolioCard cardId="allocation-by-type" title="Allocation By Type">
            <div className="flex items-center justify-center">
                <TypeAllocationChart
                    holdings={holdings}
                    hidePrices={hidePrices}
                    chartLabel="Current Net Worth"
                />
            </div>
        </PortfolioCard>
    )
}
