import { DeltaBadge } from '@/components/ui/delta-badge'
import { LogoAvatar } from '@/components/ui/logo-avatar'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/Transaction'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
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
    <div className="flex flex-col gap-2 w-full">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {title}
        </h3>
        <ul className="flex flex-col divide-y">
            {holdings.map((h) => (
                <li key={h.ticker_id} className="flex items-center justify-between gap-3 py-2.5">
                    <LogoAvatar
                        tickerLogo={h.tickerLogo}
                        ticker={h.ticker_id}
                        tickerCurrency={h.currency}
                    />
                    <div className="flex flex-col items-end gap-1">
                        <DeltaBadge value={h.unrealized_gl_eur_pct} />
                        <span
                            className={cn('text-xs text-muted-foreground tabular-nums', {
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            {formatCurrency(h.current_value_eur, Currency.EUR)}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    </div>
)

export function TopPerformersCard({ holdings, hidePrices }: Props) {
    const { best, worst } = getTopMovers(holdings, MOVERS_COUNT)

    return (
        <PortfolioCard
            cardId="top-performers"
            title="Performers"
            className="shrink-0 w-full lg:w-[50%]"
            openHeightClassName="h-full"
            contentClassName="flex flex-col gap-5 lg:flex-row lg:gap-10 lg:justify-between lg:px-5 w-full"
        >
            {best.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open positions yet</p>
            ) : (
                <>
                    <MoversList title="Best" holdings={best} hidePrices={hidePrices} />
                    {worst.length > 0 && (
                        <MoversList title="Worst" holdings={worst} hidePrices={hidePrices} />
                    )}
                </>
            )}
        </PortfolioCard>
    )
}
