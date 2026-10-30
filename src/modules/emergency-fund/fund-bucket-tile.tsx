import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { Currency } from '@/types/core/Currency'
import type { FundBucket } from '@/modules/emergency-fund/emergency-fund-card.helpers'

type Props = {
    title: string
    bucket: FundBucket
    currency: Currency
    hidePrices: boolean
    actionLabel: string
    actionValue: string
    caption?: string
    completeLabel: string
}

export function FundBucketTile({
    title,
    bucket,
    currency,
    hidePrices,
    actionLabel,
    actionValue,
    caption,
    completeLabel,
}: Props) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{title}</p>
                {bucket.isComplete && <Badge variant="success">Full</Badge>}
            </div>
            <p
                className={cn('text-base font-semibold tabular-nums tracking-tight', {
                    'blur-md select-none': hidePrices,
                })}
            >
                {formatCurrency(bucket.saved, currency)}
                <span className="text-xs font-normal text-muted-foreground">
                    {' '}
                    / {formatCurrency(bucket.goal, currency, 0)}
                </span>
            </p>
            {bucket.isComplete ? (
                <p className="text-xs text-success">{completeLabel}</p>
            ) : (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{actionLabel}</p>
                        <p
                            className={cn('text-sm font-semibold tabular-nums', {
                                'blur-md select-none': hidePrices,
                            })}
                        >
                            {actionValue}
                        </p>
                    </div>
                    {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
                </div>
            )}
        </div>
    )
}
