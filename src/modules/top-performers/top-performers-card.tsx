import { Card } from '@/components/ui/card'
import { DeltaBadge } from '@/components/ui/delta-badge'
import { AssetLogo } from '@/components/ui/asset-logo'
import { POSITIONS_ROUTE_PATH } from '@/lib/constants'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/core/Currency'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'
import { MOVERS_COUNT } from '@/modules/top-performers/top-performers-card.constants'
import { getTopMovers } from '@/modules/top-performers/top-performers-card.helpers'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

type MoversListProps = {
    title: string
    holdings: HoldingSummary[]
    hidePrices: boolean
}

const MoversList = ({ title, holdings, hidePrices }: MoversListProps) => (
    <div className="flex flex-col gap-1">
        <h3 className="text-xs text-muted-foreground">{title}</h3>
        <ul className="flex flex-col">
            {holdings.map((h) => (
                <li key={h.ticker_id} className="flex items-center gap-3 py-2">
                    <AssetLogo logo={h.tickerLogo} ticker={h.ticker_id} className="size-8" />
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{h.ticker_id}</span>
                        <span
                            className={cn('text-xs text-muted-foreground tabular-nums', {
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            {formatCurrency(h.current_value_eur, Currency.EUR)}
                        </span>
                    </span>
                    <DeltaBadge value={h.unrealized_gl_eur_pct} className="rounded-md" />
                </li>
            ))}
        </ul>
    </div>
)

export function TopPerformersCard({ holdings, hidePrices }: Props) {
    const { best, worst } = getTopMovers(holdings, MOVERS_COUNT)

    return (
        <Card aria-labelledby="top-movers-title" className="gap-3 p-5">
            <DashboardCardHeader
                id="top-movers-title"
                title="Top movers"
                href={POSITIONS_ROUTE_PATH}
                linkLabel="View all"
            />
            {best.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                    No open positions yet
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    <MoversList title="Best" holdings={best} hidePrices={hidePrices} />
                    {worst.length > 0 && (
                        <MoversList title="Worst" holdings={worst} hidePrices={hidePrices} />
                    )}
                </div>
            )}
        </Card>
    )
}
