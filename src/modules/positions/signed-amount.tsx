import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/Transaction'

type Props = {
    value: number
    hidePrices: boolean
    className?: string
}

export function SignedAmount({ value, hidePrices, className }: Props) {
    const tone = getDeltaTone(value)

    return (
        <span
            className={cn('tabular-nums', className, {
                'text-success': tone === 'positive',
                'text-destructive': tone === 'negative',
                'text-muted-foreground': tone === 'neutral',
                'blur-sm select-none': hidePrices,
            })}
        >
            {formatCurrency(value, Currency.EUR)}
        </span>
    )
}
