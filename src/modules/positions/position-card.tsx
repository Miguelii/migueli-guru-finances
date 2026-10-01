'use client'

import { DeltaBadge } from '@/components/ui/delta-badge'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/Transaction'
import { getPositionWeight, getUnrealized } from '@/modules/positions/positions.helpers'
import { PositionAsset } from '@/modules/positions/position-asset'
import { SignedAmount } from '@/modules/positions/signed-amount'

type Props = {
    holding: HoldingSummary
    includeFees: boolean
    openValueEur: number
    hidePrices: boolean
    onSelect: (id: string) => void
}

type MetricProps = {
    title: string
    children: React.ReactNode
}

const Metric = ({ title, children }: MetricProps) => (
    <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{title}</dt>
        <dd className="truncate text-sm font-medium tabular-nums">{children}</dd>
    </div>
)

export function PositionCard({ holding, includeFees, openValueEur, hidePrices, onSelect }: Props) {
    const unrealized = getUnrealized(holding, includeFees)
    const weight = getPositionWeight(holding, openValueEur)
    const blurClass = { 'blur-sm select-none': hidePrices }

    return (
        <li>
            <button
                type="button"
                onClick={() => onSelect(holding.ticker_id)}
                aria-label={`Open ${holding.symbol} details`}
                className="relative flex w-full cursor-pointer flex-col gap-3 border bg-card p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        'absolute inset-x-0 top-0 h-0.5',
                        ASSET_TYPE_META[holding.tickerType].bgClassName
                    )}
                />
                <span className="flex items-start justify-between gap-3">
                    <PositionAsset holding={holding} hidePrices={hidePrices} />
                    <span className="flex flex-col items-end gap-1">
                        <span className={cn('font-semibold tabular-nums', blurClass)}>
                            {formatCurrency(holding.current_value_eur, Currency.EUR)}
                        </span>
                        <DeltaBadge value={unrealized.pct} />
                    </span>
                </span>
                <dl className="grid grid-cols-3 gap-3 border-t pt-3">
                    <Metric title="Invested">
                        <span className={cn(blurClass)}>
                            {formatCurrency(holding.total_invested_eur, Currency.EUR)}
                        </span>
                    </Metric>
                    <Metric title="Unrealized">
                        <SignedAmount value={unrealized.value} hidePrices={hidePrices} />
                    </Metric>
                    <Metric title="Weight">{weight.toFixed(1)}%</Metric>
                </dl>
            </button>
        </li>
    )
}
