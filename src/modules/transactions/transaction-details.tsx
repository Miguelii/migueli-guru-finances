'use client'

import { Pencil, Trash2, XIcon } from 'lucide-react'
import { AssetLogo } from '@/components/ui/asset-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatQuantity } from '@/lib/portfolio/formaters'
import { getTransactionFeeEur, getTransactionValueEur } from '@/lib/portfolio/transactions-summary'
import { cn } from '@/lib/utils'
import { Currency, type CambioRates, type TickerData, type Transaction } from '@/types/Transaction'
import {
    TYPE_BADGE_VARIANT,
    TYPE_LABEL,
} from '@/modules/transactions/transactions-card/transactions-card.constants'
import { getTaxBadge } from '@/modules/transactions/transactions-card/transactions-card.helpers'
import { formatTaxRate, getCapitalGainsTax } from '@/lib/portfolio/capital-gains-tax'
import { EMPTY_VALUE } from '@/modules/transactions/transaction-row.constants'
import { formatDateTime } from '@/modules/transactions/transaction-row.helpers'
import { getTaxStepPeriod, isPastTaxStep } from '@/modules/transactions/transaction-details.helpers'

type Props = {
    transaction: Transaction
    ticker: TickerData | undefined
    rates: CambioRates
    investedAfter: number | undefined
    hidePrices: boolean
    onEdit: (transaction: Transaction) => void
    onDelete: (transaction: Transaction) => void
    onClose: () => void
}

type RowProps = {
    label: string
    children: React.ReactNode
}

const Row = ({ label, children }: RowProps) => (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="flex flex-col items-end text-right text-sm font-medium tabular-nums">
            {children}
        </dd>
    </div>
)

export function TransactionDetails({
    transaction: tx,
    ticker,
    rates,
    investedAfter,
    hidePrices,
    onEdit,
    onDelete,
    onClose,
}: Props) {
    const currency = ticker?.currency ?? Currency.EUR
    const isNative = currency !== Currency.EUR
    const tax = getCapitalGainsTax(tx, ticker?.type)
    const taxBadge = getTaxBadge(tax)
    const blurClass = { 'blur-sm select-none': hidePrices }

    const withEur = (native: number, eur: number) => (
        <span className={cn('flex flex-col items-end', blurClass)}>
            {formatCurrency(native, currency)}
            {isNative && (
                <span className="text-xs font-normal text-muted-foreground">
                    {formatCurrency(eur, Currency.EUR)}
                </span>
            )}
        </span>
    )

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <span className="flex min-w-0 items-center gap-2.5">
                    <AssetLogo logo={ticker?.logo} ticker={tx.ticker_id} />
                    <span className="truncate font-semibold">{tx.ticker_id}</span>
                    <Badge variant={TYPE_BADGE_VARIANT[tx.type]} className="rounded-none">
                        {TYPE_LABEL[tx.type]}
                    </Badge>
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close details"
                    className="size-7 cursor-pointer"
                >
                    <XIcon />
                </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                        {formatDateTime(tx.buy_date)}
                    </span>
                    <span
                        className={cn('text-3xl font-semibold tracking-tight tabular-nums', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {tx.value != null ? formatCurrency(tx.value, currency) : EMPTY_VALUE}
                    </span>
                    {isNative && tx.value != null && (
                        <span
                            className={cn('text-sm text-muted-foreground tabular-nums', blurClass)}
                        >
                            {formatCurrency(
                                getTransactionValueEur(tx, currency, rates),
                                Currency.EUR
                            )}
                        </span>
                    )}
                </div>

                <dl className="flex flex-col">
                    <Row label="Quantity">
                        <span className={cn(blurClass)}>
                            {tx.quantity != null ? formatQuantity(tx.quantity, 10) : EMPTY_VALUE}
                        </span>
                    </Row>
                    <Row label="Price">
                        <span className={cn(blurClass)}>
                            {tx.transaction_price != null
                                ? formatCurrency(tx.transaction_price, currency, 5)
                                : EMPTY_VALUE}
                        </span>
                    </Row>
                    {isNative && tx.exchange_rate != null && (
                        <Row label="Exchange rate">
                            1 {currency} = {formatCurrency(tx.exchange_rate, Currency.EUR, 4)}
                        </Row>
                    )}
                    <Row label="Fee">
                        {withEur(tx.fee, getTransactionFeeEur(tx, currency, rates))}
                    </Row>
                    {investedAfter !== undefined && (
                        <Row label="Invested after">
                            <span className={cn(blurClass)}>
                                {formatCurrency(investedAfter, Currency.EUR)}
                            </span>
                        </Row>
                    )}
                    {taxBadge && (
                        <Row label="Capital gains tax">
                            <span
                                className={cn({
                                    'text-success': taxBadge.isFinal,
                                    'text-muted-foreground': !taxBadge.isFinal,
                                })}
                            >
                                {taxBadge.label}
                            </span>
                        </Row>
                    )}
                </dl>

                {tax && tax.timeline.length > 1 && (
                    <section aria-labelledby="tax-brackets-title" className="flex flex-col gap-2">
                        <h3
                            id="tax-brackets-title"
                            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                        >
                            Tax brackets
                        </h3>
                        <ol className="flex flex-col border">
                            {tax.timeline.map((step, index) => (
                                <li
                                    key={step.from.toISOString()}
                                    aria-current={step.isCurrent ? 'step' : undefined}
                                    className={cn(
                                        'flex items-center justify-between gap-3 border-b px-3 py-2 text-sm last:border-b-0',
                                        {
                                            'bg-accent font-medium': step.isCurrent,
                                            'text-muted-foreground': isPastTaxStep(step),
                                        }
                                    )}
                                >
                                    <span className="flex items-center gap-2 tabular-nums">
                                        {formatTaxRate(step.rate)}
                                        {step.isCurrent && (
                                            <Badge variant="outline" className="rounded-none">
                                                Now
                                            </Badge>
                                        )}
                                    </span>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {getTaxStepPeriod(step, index === 0)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </div>

            <div className="flex gap-2 border-t px-4 py-3">
                <Button
                    variant="outline"
                    onClick={() => onEdit(tx)}
                    className="flex-1 cursor-pointer gap-1.5"
                >
                    <Pencil />
                    Edit
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => onDelete(tx)}
                    className="flex-1 cursor-pointer gap-1.5"
                >
                    <Trash2 />
                    Delete
                </Button>
            </div>
        </div>
    )
}
