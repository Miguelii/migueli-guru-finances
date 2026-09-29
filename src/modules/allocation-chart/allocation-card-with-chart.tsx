import type { HoldingSummary } from '@/types/Holding'
import { DonutChart } from '@/components/ui/donut-chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { AllocationView } from '@/modules/allocation-chart/allocation-card-with-chart.constants'
import {
    buildAssetAllocation,
    buildTypeAllocation,
} from '@/modules/allocation-chart/allocation-card-with-chart.helpers'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function AllocationCardWithChart({ holdings, hidePrices }: Props) {
    const assetAllocation = buildAssetAllocation(holdings)
    const typeAllocation = buildTypeAllocation(holdings)
    const totalValue = assetAllocation.reduce((sum, d) => sum + d.value, 0)

    return (
        <Tabs defaultValue={AllocationView.Asset} className="w-full min-w-0 lg:flex-1">
            <PortfolioCard
                cardId="allocation"
                title="Allocation"
                openHeightClassName="h-auto"
                actions={
                    <TabsList>
                        <TabsTrigger value={AllocationView.Asset} className="cursor-pointer px-2.5">
                            By asset
                        </TabsTrigger>
                        <TabsTrigger value={AllocationView.Type} className="cursor-pointer px-2.5">
                            By type
                        </TabsTrigger>
                    </TabsList>
                }
            >
                <TabsContent value={AllocationView.Asset}>
                    <DonutChart
                        data={assetAllocation}
                        totalValue={totalValue}
                        hidePrices={hidePrices}
                        chartLabel="Net worth"
                    />
                </TabsContent>
                <TabsContent value={AllocationView.Type}>
                    <DonutChart
                        data={typeAllocation}
                        totalValue={totalValue}
                        hidePrices={hidePrices}
                        chartLabel="Net worth"
                    />
                </TabsContent>
            </PortfolioCard>
        </Tabs>
    )
}
