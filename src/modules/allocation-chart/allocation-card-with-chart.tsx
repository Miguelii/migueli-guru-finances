import type { HoldingSummary } from '@/types/Holding'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AllocationChart } from '@/modules/allocation-chart/allocation-chart'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function AllocationCardWithChart({ holdings, hidePrices }: Props) {
    return (
        <Card className="h-112.5 w-full shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Allocation</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                <AllocationChart
                    holdings={holdings}
                    hidePrices={hidePrices}
                    chartLabel="Total Net Worth"
                />
            </CardContent>
        </Card>
    )
}
