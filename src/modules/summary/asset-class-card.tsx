import { Card } from '@/components/ui/card'
import { DeltaBadge } from '@/components/ui/delta-badge'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import type { TypeBreakdownItem } from '@/lib/portfolio/calculations'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { TickerType } from '@/types/core/TickerType'

type Props = {
    type: TickerType
    item: TypeBreakdownItem | undefined
    hidePrices: boolean
}

type ItemProps = {
    title: string
    value: number
    hidePrices: boolean
    isSigned?: boolean
}

const currency = Currency.EUR as const

const Item = ({ title, value, hidePrices, isSigned = false }: ItemProps) => {
    const tone = getDeltaTone(value)

    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">{title}</dt>
            <dd
                className={cn('text-xs font-medium whitespace-nowrap tabular-nums', {
                    'text-success': isSigned && tone === 'positive',
                    'text-destructive': isSigned && tone === 'negative',
                    'text-muted-foreground': isSigned && tone === 'neutral',
                    'blur-md select-none': hidePrices,
                })}
            >
                {formatCurrency(value, currency)}
            </dd>
        </div>
    )
}

export function AssetClassCard({ type, item, hidePrices }: Props) {
    const { label, icon: Icon, bgClassName, softClassName } = ASSET_TYPE_META[type]
    const share = item?.share ?? 0
    const currentValue = item?.totals.currentValue ?? 0
    const totalInvested = item?.totals.totalInvested ?? 0
    const unrealizedGl = item?.totals.unrealizedGl ?? 0
    const unrealizedGlPct = item?.totals.unrealizedGlPct ?? 0
    const totalRealized = item?.totals.totalRealized ?? 0

    return (
        <Card className="@container gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-sm font-medium">
                    <span
                        aria-hidden="true"
                        className={cn(
                            'grid size-9 shrink-0 place-items-center rounded-xl',
                            softClassName
                        )}
                    >
                        <Icon className="size-4.5" />
                    </span>
                    {label}
                </h2>
                <DeltaBadge value={unrealizedGlPct} className="rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
                {/* Amounts are never cut: the font shrinks with the card instead */}
                <p
                    className={cn(
                        'text-xl font-semibold tracking-tight whitespace-nowrap tabular-nums @[15rem]:text-2xl @[20rem]:text-3xl',
                        { 'blur-md select-none': hidePrices }
                    )}
                >
                    {formatCurrency(currentValue, currency)}
                </p>
                <div className="flex items-center gap-3">
                    <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        role="meter"
                        aria-label={`${label} share of portfolio`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(share)}
                    >
                        <div
                            className={cn('h-full rounded-full', bgClassName)}
                            style={{ width: `${share}%` }}
                        />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {share.toFixed(1)}% of portfolio
                    </span>
                </div>
            </div>
            <dl className="flex flex-col gap-2 border-t pt-3">
                <Item title="Invested" value={totalInvested} hidePrices={hidePrices} />
                <Item title="Unrealized" value={unrealizedGl} hidePrices={hidePrices} isSigned />
                <Item title="Realized" value={totalRealized} hidePrices={hidePrices} isSigned />
            </dl>
        </Card>
    )
}
