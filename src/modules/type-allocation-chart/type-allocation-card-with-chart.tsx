import type { HoldingSummary } from '@/types/Holding'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TypeAllocationChart } from '@/modules/type-allocation-chart/type-allocation-chart'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function TypeAllocationCardWithChart({ holdings, hidePrices }: Props) {
    return (
        <Card className="h-112.5 w-full shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Allocation By Type</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <TypeAllocationChart
                    holdings={holdings}
                    hidePrices={hidePrices}
                    chartLabel="Current Net Worth"
                />
            </CardContent>
        </Card>
    )
}
