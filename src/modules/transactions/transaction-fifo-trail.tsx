'use client'

import { ArrowDown, ArrowUp, CornerDownRight } from 'lucide-react'
import { formatDate, formatQuantity } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { Ticker } from '@/types/core/Ticker'
import { TYPE_LABEL } from '@/modules/transactions/transactions-card/transactions-card.constants'
import { formatSaleTaxRate } from '@/modules/transactions/transactions-card/transactions-card.helpers'
import { TRAIL_LABEL } from '@/modules/transactions/transaction-fifo-trail.constants'
import type { FifoTrail } from '@/modules/transactions/transaction-fifo-trail.helpers'

type Props = {
    trail: FifoTrail
    ticker: Ticker
    hidePrices: boolean
    onJump: (id: string) => void
    onShowAll: () => void
}

export function TransactionFifoTrail({ trail, ticker, hidePrices, onJump, onShowAll }: Props) {
    // The list is newest first: a SELL's lots sit further down, a lot's sales further up
    const DirectionIcon = trail.kind === 'sell' ? ArrowDown : ArrowUp
    const blurClass = { 'blur-sm select-none': hidePrices }

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-3 pb-3 text-xs md:pb-2.5 md:pl-24">
            <span className="flex items-center gap-1 text-muted-foreground">
                <CornerDownRight aria-hidden="true" className="size-3.5" />
                {TRAIL_LABEL[trail.kind]}
            </span>

            {trail.links.map((link) => (
                <button
                    key={link.targetId}
                    type="button"
                    onClick={() => onJump(link.targetId)}
                    aria-label={`Go to ${TYPE_LABEL[link.targetType]} of ${formatDate(link.date)}`}
                    className="group/link inline-flex h-7 cursor-pointer touch-manipulation items-center gap-1.5 rounded-md border bg-background px-2 tabular-nums transition-colors hover:border-brand/50 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
                >
                    <span className="text-muted-foreground">{TYPE_LABEL[link.targetType]}</span>
                    <span className="font-medium">{formatDate(link.date)}</span>
                    <span aria-hidden="true" className="text-muted-foreground">
                        ·
                    </span>
                    <span className={cn(blurClass)}>
                        {formatQuantity(link.quantity)} {ticker}
                    </span>
                    {link.taxRate !== null && (
                        <span
                            className={cn({
                                'text-success': link.taxRate === 0,
                                'text-muted-foreground': link.taxRate > 0,
                            })}
                        >
                            {formatSaleTaxRate(link.taxRate)}
                        </span>
                    )}
                    <DirectionIcon
                        aria-hidden="true"
                        className="size-3 text-muted-foreground transition-colors group-hover/link:text-brand"
                    />
                </button>
            ))}

            {trail.hiddenCount > 0 && (
                <button
                    type="button"
                    onClick={onShowAll}
                    className="inline-flex h-7 cursor-pointer touch-manipulation items-center rounded-md px-1.5 font-medium text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
                >
                    +{trail.hiddenCount} more
                </button>
            )}

            {trail.remainingQuantity > 0 && (
                <span className="text-muted-foreground">
                    <span className={cn('tabular-nums', blurClass)}>
                        {formatQuantity(trail.remainingQuantity, 8)} {ticker}
                    </span>{' '}
                    still open
                </span>
            )}
        </div>
    )
}
