import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeltaBadge } from '@/components/ui/delta-badge'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import type { TypeBreakdownItem } from '@/lib/portfolio/calculations'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency, type TickerType } from '@/types/Transaction'

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
        <div className="flex items-center justify-between">
            <dt className="text-xs text-muted-foreground">{title}</dt>
            <dd
                className={cn('text-xs font-medium tabular-nums', {
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
    const { label, icon: Icon, bgClassName } = ASSET_TYPE_META[type]
    const share = item?.share ?? 0
    const currentValue = item?.totals.currentValue ?? 0
    const totalInvested = item?.totals.totalInvested ?? 0
    const unrealizedGl = item?.totals.unrealizedGl ?? 0
    const unrealizedGlPct = item?.totals.unrealizedGlPct ?? 0
    const totalRealized = item?.totals.totalRealized ?? 0

    return (
        <Card className="relative gap-0 py-0 transition-shadow duration-200 hover:shadow-md">
            <span
                aria-hidden="true"
                className={cn('absolute inset-x-0 top-0 h-0.5', bgClassName)}
            />
            <CardHeader className="flex flex-row items-center justify-between pt-4 pb-0">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <span
                        aria-hidden="true"
                        className="grid size-7 place-items-center bg-muted text-foreground"
                    >
                        <Icon className="size-4" />
                    </span>
                    {label}
                </CardTitle>
                <DeltaBadge value={unrealizedGlPct} />
            </CardHeader>
            <CardContent className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                    <p
                        className={cn('text-2xl font-semibold tabular-nums tracking-tight', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(currentValue, currency)}
                    </p>
                    <div className="flex items-center gap-2">
                        <div
                            className="h-1 flex-1 overflow-hidden bg-muted"
                            role="meter"
                            aria-label={`${label} share of portfolio`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(share)}
                        >
                            <div
                                className={cn('h-full', bgClassName)}
                                style={{ width: `${share}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {share.toFixed(1)}% of portfolio
                        </span>
                    </div>
                </div>
                <dl className="flex flex-col gap-2 border-t pt-3">
                    <Item title="Invested" value={totalInvested} hidePrices={hidePrices} />
                    <Item
                        title="Unrealized"
                        value={unrealizedGl}
                        hidePrices={hidePrices}
                        isSigned
                    />
                    <Item title="Realized" value={totalRealized} hidePrices={hidePrices} isSigned />
                </dl>
            </CardContent>
        </Card>
    )
}
