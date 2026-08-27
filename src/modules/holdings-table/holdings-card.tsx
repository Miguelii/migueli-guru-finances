import { Table } from '@/components/ui/table'
import type { HoldingSummary } from '@/types/Holding'
import { HoldingsCardTableHeader } from '@/modules/holdings-table/holding-card-table-header'
import { HoldingsCardTableContent } from '@/modules/holdings-table/holdings-card-table-content'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'

export type HoldingsCardProps = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function HoldingsCard({ holdings, hidePrices }: HoldingsCardProps) {
    return (
        <PortfolioCard
            cardId="holdings"
            title="Positions"
            className="min-w-0"
            openHeightClassName="h-138"
            contentClassName="h-full min-h-0 overflow-x-auto overflow-y-auto"
        >
            <Table>
                <HoldingsCardTableHeader />
                <HoldingsCardTableContent holdings={holdings} hidePrices={hidePrices} />
            </Table>
        </PortfolioCard>
    )
}
