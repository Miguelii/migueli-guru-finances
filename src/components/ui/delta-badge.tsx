import { cn } from '@/lib/utils'
import { formatPercentage } from '@/lib/portfolio/formaters'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { DELTA_TONE_ICON, DELTA_TONE_LABEL } from '@/components/ui/delta-badge.constants'

type Props = {
    /** Percentage change, e.g. `12.4` for +12.4% */
    value: number
    className?: string
}

export function DeltaBadge({ value, className }: Props) {
    const tone = getDeltaTone(value)
    const Icon = DELTA_TONE_ICON[tone]

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium tabular-nums',
                {
                    'bg-success/10 text-success': tone === 'positive',
                    'bg-destructive/10 text-destructive': tone === 'negative',
                    'bg-muted text-muted-foreground': tone === 'neutral',
                },
                className
            )}
        >
            <Icon aria-hidden="true" className="size-3.5" />
            <span className="sr-only">{DELTA_TONE_LABEL[tone]}</span>
            {formatPercentage(Math.abs(value))}
        </span>
    )
}
