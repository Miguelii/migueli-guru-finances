import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import { KPI_ACCENT_COLOR, type KpiAccent } from '@/modules/dashboard/kpi-card.constants'
import { KpiSparkline } from '@/modules/dashboard/kpi-sparkline'

type Props = {
    title: string
    value: number
    icon: LucideIcon
    accent: KpiAccent
    caption: ReactNode
    sparkline: number[]
    hidePrices: boolean
}

export function KpiCard({
    title,
    value,
    icon: Icon,
    accent,
    caption,
    sparkline,
    hidePrices,
}: Props) {
    return (
        <Card className="@container gap-3 p-5">
            <div className="flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className={cn('grid size-9 shrink-0 place-items-center rounded-xl', {
                        'bg-brand/10 text-brand': accent === 'brand',
                        'bg-success/10 text-success': accent === 'success',
                        'bg-destructive/10 text-destructive': accent === 'destructive',
                    })}
                >
                    <Icon className="size-4.5" />
                </span>
                <h2 className="text-sm text-muted-foreground">{title}</h2>
            </div>
            {/* Own row with the full card width: amounts are never cut, the font shrinks instead */}
            <p
                className={cn(
                    'text-xl font-semibold tracking-tight whitespace-nowrap tabular-nums @[15rem]:text-2xl @[20rem]:text-3xl',
                    { 'blur-md select-none': hidePrices }
                )}
            >
                {formatCurrency(value, Currency.EUR)}
            </p>
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0 text-xs">{caption}</div>
                <KpiSparkline values={sparkline} color={KPI_ACCENT_COLOR[accent]} />
            </div>
        </Card>
    )
}
