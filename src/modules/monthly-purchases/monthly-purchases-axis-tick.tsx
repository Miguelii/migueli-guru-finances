import type { XAxisTickContentProps } from 'recharts'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'

type Props = Partial<XAxisTickContentProps> & {
    monthlyTotals: number[]
    hidePrices: boolean
}

export function MonthlyPurchasesAxisTick({
    x = 0,
    y = 0,
    index = 0,
    payload,
    textAnchor = 'middle',
    monthlyTotals,
    hidePrices,
}: Props) {
    return (
        <text x={x} y={y} textAnchor={textAnchor} className="fill-muted-foreground">
            <tspan x={x}>{payload?.value}</tspan>
            <tspan
                x={x}
                dy={12}
                className={cn('text-[9px] tabular-nums', {
                    'blur-sm select-none': hidePrices,
                })}
            >
                {formatCurrency(monthlyTotals[index] ?? 0, Currency.EUR, 0)}
            </tspan>
        </text>
    )
}
