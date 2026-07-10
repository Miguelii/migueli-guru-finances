import type { HoldingSummary } from '@/types/Holding'
import { formatCurrency, formatPercentage } from '@/lib/formaters'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricCard } from '@/components/ui/metric-card'
import { Currency } from '@/types/Transaction'
import { computePortfolioTotals } from '@/lib/calculations'
import type { PropsWithChildren } from 'react'

type Props = {
    title: string
    icon: LucideIcon
    holdings: HoldingSummary[]
    hidePrices: boolean
}

const currency = Currency.EUR as const

type ItemProps = PropsWithChildren<{
    className?: string
    title: string
}>
const Item = ({ className, title, children }: ItemProps) => {
    return (
        <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn('text-xs font-medium tabular-nums', className)}>{children}</p>
        </div>
    )
}

export function PortfolioSummaryCardsItem({ title, icon: Icon, holdings, hidePrices }: Props) {
    const { totalInvested, currentValue, unrealizedGl, unrealizedGlPct, totalRealized } =
        computePortfolioTotals(holdings)
    const isNeutral = unrealizedGl == 0
    const isPositive = unrealizedGl > 0
    const isNegative = unrealizedGl < 0

    const getUnrealizedPercentageColor = () => {
        if (isNeutral) return 'text-muted-foreground'
        if (isPositive) return 'text-success'
        if (isNegative) return 'text-destructive'
        return 'text-muted-foreground'
    }

    const getRealizedColor = () => {
        if (totalRealized == 0) return 'text-muted-foreground'
        if (totalRealized > 0) return 'text-success'
        if (totalRealized < 0) return 'text-destructive'
        return 'text-muted-foreground'
    }

    return (
        <MetricCard title={title} icon={Icon}>
            <div
                className={cn('flex flex-row w-full justify-between items-center gap-0.5', {
                    'blur-md select-none': hidePrices,
                })}
            >
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                    {formatCurrency(currentValue, currency)}
                </p>
                <p className={cn('text-xs font-medium', getUnrealizedPercentageColor())}>
                    {formatPercentage(unrealizedGlPct)}
                </p>
            </div>
            <div
                className={cn('flex flex-col gap-2', {
                    'blur-md select-none': hidePrices,
                })}
            >
                <Item title="Invested">{formatCurrency(totalInvested, currency)}</Item>
                <Item title="Realized" className={getRealizedColor()}>
                    {formatCurrency(totalRealized, currency)}
                </Item>
                <Item title="Unrealized" className={getUnrealizedPercentageColor()}>
                    {formatCurrency(unrealizedGl, currency)}
                </Item>
            </div>
        </MetricCard>
    )
}
