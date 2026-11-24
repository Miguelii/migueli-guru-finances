'use client'

import { ChevronRight, TriangleAlert } from 'lucide-react'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/portfolio/formaters'
import type { FifoLot, FifoSell } from '@/lib/portfolio/fifo-ledger'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { Ticker } from '@/types/core/Ticker'
import { TransactionType, type Transaction } from '@/types/Transaction'
import { TYPE_LABEL } from '@/modules/transactions/transactions-card/transactions-card.constants'
import { formatSaleTaxRate } from '@/modules/transactions/transactions-card/transactions-card.helpers'
import {
    formatHoldingPeriod,
    formatSignedEur,
    formatSoldShare,
    getSoldShare,
} from '@/modules/transactions/transaction-fifo-details.helpers'

type Props = {
    transaction: Transaction
    fifoSell: FifoSell | undefined
    fifoLot: FifoLot | undefined
    hidePrices: boolean
    onSelectLinked: (id: string) => void
}

type LinkItemProps = {
    targetId: string
    targetType: TransactionType
    date: Transaction['buy_date']
    heldFor: string
    quantity: number
    ticker: Ticker
    taxRate: number | null
    gainEur: number
    hidePrices: boolean
    onSelect: (id: string) => void
}

const LinkItem = ({
    targetId,
    targetType,
    date,
    heldFor,
    quantity,
    ticker,
    taxRate,
    gainEur,
    hidePrices,
    onSelect,
}: LinkItemProps) => (
    <li className="border-b last:border-b-0">
        <button
            type="button"
            onClick={() => onSelect(targetId)}
            aria-label={`Open ${TYPE_LABEL[targetType]} of ${formatDate(date)}`}
            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:bg-accent focus-visible:outline-none"
        >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center justify-between gap-3">
                    <span className="font-medium tabular-nums">
                        {TYPE_LABEL[targetType]} · {formatDate(date)}
                    </span>
                    <span className={cn('tabular-nums', { 'blur-sm select-none': hidePrices })}>
                        {formatQuantity(quantity, 8)} {ticker}
                    </span>
                </span>
                <span className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Held {heldFor}</span>
                    <span className="flex items-center gap-1.5 tabular-nums">
                        {taxRate !== null && (
                            <span className={cn({ 'text-success': taxRate === 0 })}>
                                {formatSaleTaxRate(taxRate)}
                            </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span
                            className={cn({
                                'text-success': gainEur > 0,
                                'text-destructive': gainEur < 0,
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            {formatSignedEur(gainEur)}
                        </span>
                    </span>
                </span>
            </span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </button>
    </li>
)

type SectionTitleProps = {
    id: string
    children: React.ReactNode
}

const SectionTitle = ({ id, children }: SectionTitleProps) => (
    <h3 id={id} className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {children}
    </h3>
)

export function TransactionFifoDetails({
    transaction: tx,
    fifoSell,
    fifoLot,
    hidePrices,
    onSelectLinked,
}: Props) {
    const blurClass = { 'blur-sm select-none': hidePrices }

    if (fifoSell && (fifoSell.lots.length > 0 || fifoSell.unmatchedQuantity > 0)) {
        return (
            <section aria-labelledby="fifo-lots-title" className="flex flex-col gap-2">
                <SectionTitle id="fifo-lots-title">Lots sold (FIFO)</SectionTitle>
                <p className="text-xs text-muted-foreground">
                    Sales use your oldest lots first, the order required to declare them.
                </p>

                {fifoSell.lots.length > 0 && (
                    <ol className="flex flex-col border">
                        {fifoSell.lots.map((lot) => (
                            <LinkItem
                                key={lot.lotId}
                                targetId={lot.lotId}
                                targetType={lot.lotType}
                                date={lot.acquiredAt}
                                heldFor={formatHoldingPeriod(lot.acquiredAt, tx.buy_date)}
                                quantity={lot.quantity}
                                ticker={tx.ticker_id}
                                taxRate={lot.taxRate}
                                gainEur={lot.gainEur}
                                hidePrices={hidePrices}
                                onSelect={onSelectLinked}
                            />
                        ))}
                    </ol>
                )}

                {fifoSell.unmatchedQuantity > 0 && (
                    <p className="flex items-start gap-2 text-xs text-warning">
                        <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                        <span>
                            <span className={cn('tabular-nums', blurClass)}>
                                {formatQuantity(fifoSell.unmatchedQuantity, 8)} {tx.ticker_id}
                            </span>{' '}
                            had no earlier buy to match and counts at zero cost. Check for a missing
                            transaction.
                        </span>
                    </p>
                )}

                <dl className="flex flex-col text-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2">
                        <dt className="text-muted-foreground">Cost basis</dt>
                        <dd className={cn('font-medium tabular-nums', blurClass)}>
                            {formatCurrency(fifoSell.costEur, Currency.EUR)}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-2">
                        <dt className="text-muted-foreground">Realized gain</dt>
                        <dd
                            className={cn('font-medium tabular-nums', blurClass, {
                                'text-success': fifoSell.gainEur > 0,
                                'text-destructive': fifoSell.gainEur < 0,
                            })}
                        >
                            {formatSignedEur(fifoSell.gainEur)}
                        </dd>
                    </div>
                </dl>
            </section>
        )
    }

    if (fifoLot && fifoLot.sales.length > 0) {
        const soldShare = getSoldShare(fifoLot)

        return (
            <section aria-labelledby="fifo-sales-title" className="flex flex-col gap-2">
                <SectionTitle id="fifo-sales-title">Sales (FIFO)</SectionTitle>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span>
                            Sold{' '}
                            <span className={cn('font-medium tabular-nums', blurClass)}>
                                {formatQuantity(fifoLot.soldQuantity, 8)}
                            </span>{' '}
                            of{' '}
                            <span className={cn('tabular-nums', blurClass)}>
                                {formatQuantity(fifoLot.acquiredQuantity, 8)} {tx.ticker_id}
                            </span>
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {formatSoldShare(soldShare)}
                        </span>
                    </div>
                    <div
                        role="progressbar"
                        aria-label="Share of this lot sold"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(soldShare * 100)}
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                        <div
                            className={cn('h-full rounded-full', {
                                'bg-muted-foreground': fifoLot.isClosed,
                                'bg-brand': !fifoLot.isClosed,
                            })}
                            style={{ width: `${soldShare * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {fifoLot.isClosed ? (
                            'Fully sold: this lot is closed and no longer part of the position.'
                        ) : (
                            <>
                                <span className={cn('tabular-nums', blurClass)}>
                                    {formatQuantity(fifoLot.remainingQuantity, 8)} {tx.ticker_id}
                                </span>{' '}
                                still open, next in line for the following sale.
                            </>
                        )}
                    </p>
                </div>

                <ol className="flex flex-col border">
                    {fifoLot.sales.map((sale) => (
                        <LinkItem
                            key={sale.sellId}
                            targetId={sale.sellId}
                            targetType={TransactionType.Sell}
                            date={sale.soldAt}
                            heldFor={formatHoldingPeriod(tx.buy_date, sale.soldAt)}
                            quantity={sale.quantity}
                            ticker={tx.ticker_id}
                            taxRate={sale.taxRate}
                            gainEur={sale.gainEur}
                            hidePrices={hidePrices}
                            onSelect={onSelectLinked}
                        />
                    ))}
                </ol>
            </section>
        )
    }

    return null
}
