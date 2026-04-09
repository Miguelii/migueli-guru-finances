import type { HoldingSummary } from '@/types/Holding'
import { formatCurrency, formatPercentage } from '@/lib/formaters'
import { Wallet, Bitcoin, BarChart3, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricCard } from '@/components/ui/metric-card'
import { Currency, type CambioRates } from '@/types/Transaction'
import { computePortfolioTotals } from '@/lib/calculations'

type Props = {
    holdings: HoldingSummary[]
    rates: CambioRates
    hidePrices: boolean
}

const currency = Currency.EUR

export function PortfolioSummaryCards({ holdings, rates, hidePrices }: Props) {
    const cryptoHoldings = holdings.filter((h) => h.tickerType === 'CRYPTO')
    const etfHoldings = holdings.filter((h) => h.tickerType === 'ETF')
    const stockHoldings = holdings.filter((h) => h.tickerType === 'STOCK')

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <PortfolioSummaryCard
                title="Total Net Worth"
                icon={Wallet}
                holdings={holdings}
                rates={rates}
                hidePrices={hidePrices}
            />
            <PortfolioSummaryCard
                title="Crypto"
                icon={Bitcoin}
                holdings={cryptoHoldings}
                rates={rates}
                hidePrices={hidePrices}
            />
            <PortfolioSummaryCard
                title="ETFs"
                icon={BarChart3}
                holdings={etfHoldings}
                rates={rates}
                hidePrices={hidePrices}
            />
            <PortfolioSummaryCard
                title="Stocks"
                icon={TrendingUp}
                holdings={stockHoldings}
                rates={rates}
                hidePrices={hidePrices}
            />
        </section>
    )
}

type PortfolioSummaryCardProps = {
    title: string
    icon: LucideIcon
    holdings: HoldingSummary[]
    rates: CambioRates
    hidePrices: boolean
}

function PortfolioSummaryCard({
    title,
    icon: Icon,
    holdings,
    rates,
    hidePrices,
}: PortfolioSummaryCardProps) {
    const { totalInvested, currentValue, glValue, glPct, totalRealize } = computePortfolioTotals(
        holdings,
        rates
    )
    const isNeutral = glValue == 0
    const isPositive = glValue > 0
    const isNegative = glValue < 0

    return (
        <MetricCard title={title} icon={Icon}>
            <div className={cn({ 'blur-md select-none': hidePrices })}>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                    {formatCurrency(currentValue, currency)}
                </p>
            </div>
            <div
                className={cn('flex flex-col gap-2', {
                    'blur-md select-none': hidePrices,
                })}
            >
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="text-xs font-medium tabular-nums">
                        {formatCurrency(totalInvested, currency)}
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Realized</p>
                    <p
                        className={cn('text-xs font-medium tabular-nums', {
                            'text-success': totalRealize >= 0,
                            'text-destructive': totalRealize < 0,
                        })}
                    >
                        {formatCurrency(totalRealize, currency)}
                    </p>
                </div>
                <div
                    className={cn('flex items-center justify-between pb-1 border-t pt-2', {
                        'border-border': true,
                    })}
                >
                    <p className="text-xs font-medium text-muted-foreground">Unrealized</p>
                    <div
                        className={cn('flex items-center gap-0.5 text-xs font-medium', {
                            'text-muted-foreground': isNeutral,
                            'text-success': isPositive,
                            'text-destructive': isNegative,
                        })}
                    >
                        <span className="tabular-nums">
                            {formatCurrency(glValue, currency)} · {formatPercentage(glPct)}
                        </span>
                    </div>
                </div>
            </div>
        </MetricCard>
    )
}
