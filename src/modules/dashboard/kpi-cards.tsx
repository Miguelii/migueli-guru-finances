import { PiggyBankIcon, TrendingDownIcon, TrendingUpIcon, WalletIcon } from 'lucide-react'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { DELTA_TONE_ICON } from '@/components/ui/delta-badge.constants'
import type { PortfolioTotals } from '@/lib/portfolio/calculations'
import { formatCurrency, formatPercentage } from '@/lib/portfolio/formaters'
import type { InvestedTimelinePoint } from '@/lib/portfolio/invested-timeline'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import { KpiCard } from '@/modules/dashboard/kpi-card'
import {
    getMonthOverMonthChange,
    getMonthlyInvestedChange,
    toSparkline,
} from '@/modules/dashboard/kpi-cards.helpers'

type Props = {
    totals: PortfolioTotals
    valuePoints: PortfolioSnapshotPoint[]
    investedPoints: InvestedTimelinePoint[]
    hidePrices: boolean
}

type DeltaCaptionProps = {
    value: number
    text: string
    suffix: string
    hidePrices?: boolean
}

const DeltaCaption = ({ value, text, suffix, hidePrices = false }: DeltaCaptionProps) => {
    const tone = getDeltaTone(value)
    const Icon = DELTA_TONE_ICON[tone]

    return (
        <p
            className={cn('flex flex-wrap items-center gap-x-1 gap-y-0.5', {
                'text-success': tone === 'positive',
                'text-destructive': tone === 'negative',
                'text-muted-foreground': tone === 'neutral',
            })}
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            <span
                className={cn('font-medium whitespace-nowrap tabular-nums', {
                    'blur-sm select-none': hidePrices,
                })}
            >
                {text}
            </span>
            <span className="text-muted-foreground">{suffix}</span>
        </p>
    )
}

export function KpiCards({ totals, valuePoints, investedPoints, hidePrices }: Props) {
    const monthChange = getMonthOverMonthChange(valuePoints)
    const investedChange = getMonthlyInvestedChange(investedPoints)
    const gainTone = getDeltaTone(totals.unrealizedGl)

    return (
        <section
            aria-label="Key figures"
            className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6"
        >
            <KpiCard
                title="Net worth"
                value={totals.currentValue}
                icon={WalletIcon}
                accent="brand"
                hidePrices={hidePrices}
                sparkline={toSparkline(valuePoints.map((point) => point.valueEur))}
                caption={
                    monthChange === null ? (
                        <p className="text-muted-foreground">No history yet</p>
                    ) : (
                        <DeltaCaption
                            value={monthChange}
                            text={`${monthChange > 0 ? '+' : ''}${formatPercentage(monthChange)}`}
                            suffix="this month"
                        />
                    )
                }
            />
            <KpiCard
                title="Invested"
                value={totals.totalInvested}
                icon={PiggyBankIcon}
                accent="success"
                hidePrices={hidePrices}
                sparkline={toSparkline(investedPoints.map((point) => point.investedEur))}
                caption={
                    <DeltaCaption
                        value={investedChange}
                        text={`${investedChange > 0 ? '+' : ''}${formatCurrency(investedChange, Currency.EUR)}`}
                        suffix="this month"
                        hidePrices={hidePrices}
                    />
                }
            />
            <KpiCard
                title="Unrealized gain"
                value={totals.unrealizedGl}
                icon={gainTone === 'negative' ? TrendingDownIcon : TrendingUpIcon}
                accent={gainTone === 'negative' ? 'destructive' : 'success'}
                hidePrices={hidePrices}
                sparkline={toSparkline(
                    valuePoints.map((point) => point.valueEur - point.investedEur)
                )}
                caption={
                    <DeltaCaption
                        value={totals.unrealizedGlPct}
                        text={`${totals.unrealizedGlPct > 0 ? '+' : ''}${formatPercentage(totals.unrealizedGlPct)}`}
                        suffix="on invested"
                    />
                }
            />
        </section>
    )
}
