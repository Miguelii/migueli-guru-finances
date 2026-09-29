import { Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DeltaBadge } from '@/components/ui/delta-badge'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { computePortfolioTotals, computeTypeBreakdown } from '@/lib/portfolio/calculations'
import { buildInvestedTimeline } from '@/lib/portfolio/invested-timeline'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import {
    Currency,
    TickerType,
    type CambioRates,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'
import { AllocationBar } from '@/modules/net-worth-hero/allocation-bar'
import { InvestedTimelineChart } from '@/modules/net-worth-hero/invested-timeline-chart'

type Props = {
    holdings: HoldingSummary[]
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    hidePrices: boolean
}

type StatProps = {
    title: string
    value: number
    hidePrices: boolean
    isSigned?: boolean
}

const currency = Currency.EUR

const Stat = ({ title, value, hidePrices, isSigned = false }: StatProps) => {
    const tone = getDeltaTone(value)

    return (
        <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{title}</dt>
            <dd
                className={cn('truncate text-sm font-semibold tabular-nums', {
                    'text-success': isSigned && tone === 'positive',
                    'text-destructive': isSigned && tone === 'negative',
                    'blur-md select-none': hidePrices,
                })}
            >
                {formatCurrency(value, currency)}
            </dd>
        </div>
    )
}

export function NetWorthHero({ holdings, transactions, tickerData, rates, hidePrices }: Props) {
    const totals = computePortfolioTotals(holdings)
    const { currentValue: currentValueNoCrypto } = computePortfolioTotals(
        holdings.filter((h) => h.tickerType !== TickerType.Crypto)
    )
    const breakdown = computeTypeBreakdown(holdings)
    const timeline = buildInvestedTimeline(transactions, tickerData, rates)

    return (
        <Card className="gap-0 py-0 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section
                aria-labelledby="net-worth-title"
                className="flex flex-col gap-6 border-b p-5 lg:border-r lg:border-b-0 lg:p-6"
            >
                <div className="flex items-center justify-between">
                    <h2
                        id="net-worth-title"
                        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    >
                        Net worth
                    </h2>
                    <Wallet aria-hidden="true" className="size-4 text-muted-foreground" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <p
                            className={cn(
                                'text-4xl font-semibold tabular-nums tracking-tight md:text-5xl',
                                { 'blur-md select-none': hidePrices }
                            )}
                        >
                            {formatCurrency(totals.currentValue, currency)}
                        </p>
                        <DeltaBadge value={totals.unrealizedGlPct} className="text-sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Excl. crypto{' '}
                        <span
                            className={cn('font-medium text-foreground tabular-nums', {
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            {formatCurrency(currentValueNoCrypto, currency)}
                        </span>
                    </p>
                </div>

                <dl className="grid grid-cols-3 gap-4 border-y py-4">
                    <Stat title="Invested" value={totals.totalInvested} hidePrices={hidePrices} />
                    <Stat
                        title="Unrealized"
                        value={totals.unrealizedGl}
                        hidePrices={hidePrices}
                        isSigned
                    />
                    <Stat
                        title="Realized"
                        value={totals.totalRealized}
                        hidePrices={hidePrices}
                        isSigned
                    />
                </dl>

                <AllocationBar breakdown={breakdown} />
            </section>

            <section
                aria-labelledby="invested-capital-title"
                className="flex min-w-0 flex-col gap-4 p-5 lg:p-6"
            >
                <div className="flex flex-col gap-0.5">
                    <h2 id="invested-capital-title" className="text-sm font-semibold">
                        Invested capital
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Cost basis of open positions at the end of each month, against today&apos;s
                        value
                    </p>
                </div>
                <div className="flex-1">
                    <InvestedTimelineChart
                        points={timeline}
                        currentValue={totals.currentValue}
                        hidePrices={hidePrices}
                    />
                </div>
            </section>
        </Card>
    )
}
