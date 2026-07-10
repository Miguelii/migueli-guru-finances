import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import type { HoldingSummary } from '@/types/Holding'
import { HoldingsCardTableHeader } from '@/modules/holdings-table/holding-card-table-header'
import { HoldingsCardTableContent } from '@/modules/holdings-table/holdings-card-table-content'

export type HoldingsCardProps = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function HoldingsCard({ holdings, hidePrices }: HoldingsCardProps) {
    return (
        <Card className="shadow-sm w-full min-w-0">
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <HoldingsCardTableHeader />
                    <HoldingsCardTableContent holdings={holdings} hidePrices={hidePrices} />
                </Table>
            </CardContent>
        </Card>
    )
}
