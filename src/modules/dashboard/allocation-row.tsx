import type { ReactNode } from 'react'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'

type Props = {
    label: string
    icon: ReactNode
    valueEur: number
    share: number
    unrealizedGlPct: number
    barClassName?: string
    barColor?: string
    hidePrices: boolean
}

export function AllocationRow({
    label,
    icon,
    valueEur,
    share,
    unrealizedGlPct,
    barClassName,
    barColor,
    hidePrices,
}: Props) {
    const tone = getDeltaTone(unrealizedGlPct)

    return (
        <li className="flex items-center gap-3">
            {icon}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">{label}</span>
                    <span
                        className={cn('text-sm font-semibold tabular-nums', {
                            'blur-sm select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(valueEur, Currency.EUR, 0)}
                    </span>
                </div>
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
                            className={cn('h-full rounded-full', barClassName)}
                            style={{ width: `${share}%`, backgroundColor: barColor }}
                        />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {share.toFixed(1)}% ·{' '}
                        <span
                            className={cn({
                                'text-success': tone === 'positive',
                                'text-destructive': tone === 'negative',
                            })}
                        >
                            {unrealizedGlPct > 0 ? '+' : ''}
                            {unrealizedGlPct.toFixed(1)}%
                        </span>
                    </span>
                </div>
            </div>
        </li>
    )
}
