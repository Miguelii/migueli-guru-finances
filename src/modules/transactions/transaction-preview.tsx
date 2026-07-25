import { formatCurrency, formatQuantity } from '@/lib/formaters'
import { cn } from '@/lib/utils'
import type { HoldingPreview } from '@/modules/transactions/transaction-drawer.helpers'

type Props = {
    preview: HoldingPreview
}

export function TransactionPreview({ preview }: Props) {
    const { currency, before, after } = preview

    return (
        <div className="flex flex-col gap-2 border border-border bg-muted/50 p-3">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                With new transaction
            </span>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-muted-foreground">{formatQuantity(before.quantity)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{formatQuantity(after.quantity)}</span>
                </span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AC/Share</span>
                <span className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-muted-foreground">
                        {formatCurrency(before.avgCost, currency)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span
                        className={cn('font-medium', {
                            'text-success': after.avgCost < before.avgCost,
                            'text-destructive': after.avgCost > before.avgCost,
                        })}
                    >
                        {formatCurrency(after.avgCost, currency)}
                    </span>
                </span>
            </div>
        </div>
    )
}
