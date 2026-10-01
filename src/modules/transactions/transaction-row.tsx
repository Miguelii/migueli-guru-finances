'use client'

import { AssetLogo } from '@/components/ui/asset-logo'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatQuantity } from '@/lib/portfolio/formaters'
import { getTransactionValueEur } from '@/lib/portfolio/transactions-summary'
import { cn } from '@/lib/utils'
import {
    Currency,
    TransactionType,
    type CambioRates,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'
import {
    TYPE_BADGE_VARIANT,
    TYPE_LABEL,
} from '@/modules/transactions/transactions-card/transactions-card.constants'
import { getTaxBadge } from '@/modules/transactions/transactions-card/transactions-card.helpers'
import { getCapitalGainsTax } from '@/lib/portfolio/capital-gains-tax'
import {
    EMPTY_VALUE,
    TRANSACTION_ROW_GRID_CLASS,
} from '@/modules/transactions/transaction-row.constants'
import { formatDayMonth, formatTime } from '@/modules/transactions/transaction-row.helpers'

type Props = {
    transaction: Transaction
    ticker: TickerData | undefined
    rates: CambioRates
    isSelected: boolean
    hidePrices: boolean
    onSelect: (id: string) => void
}

export function TransactionRow({
    transaction: tx,
    ticker,
    rates,
    isSelected,
    hidePrices,
    onSelect,
}: Props) {
    const currency = ticker?.currency ?? Currency.EUR
    const isNative = currency !== Currency.EUR
    const taxBadge = getTaxBadge(getCapitalGainsTax(tx, ticker?.type))
    const blurClass = { 'blur-sm select-none': hidePrices }
    const hasQuantity = tx.quantity != null && tx.type !== TransactionType.Fee

    const value =
        tx.value != null ? (
            <span className={cn('font-medium tabular-nums', blurClass)}>
                {formatCurrency(tx.value, currency)}
            </span>
        ) : (
            <span className="text-muted-foreground">{EMPTY_VALUE}</span>
        )

    const valueEur = isNative && tx.value != null && (
        <span className={cn('text-xs text-muted-foreground tabular-nums', blurClass)}>
            {formatCurrency(getTransactionValueEur(tx, currency, rates), Currency.EUR)}
        </span>
    )

    const quantity = hasQuantity ? (
        <span className={cn('tabular-nums', blurClass)}>
            {formatQuantity(tx.quantity!)} {tx.ticker_id}
        </span>
    ) : (
        <span className="text-muted-foreground">{EMPTY_VALUE}</span>
    )

    const price = tx.transaction_price != null && (
        <span className={cn('text-xs text-muted-foreground tabular-nums', blurClass)}>
            @ {formatCurrency(tx.transaction_price, currency)}
        </span>
    )

    const fee = (
        <span className={cn('text-xs text-muted-foreground tabular-nums', blurClass)}>
            {formatCurrency(tx.fee, currency)}
        </span>
    )

    const typeBadge = (
        <Badge variant={TYPE_BADGE_VARIANT[tx.type]} className="rounded-none">
            {TYPE_LABEL[tx.type]}
        </Badge>
    )

    const tax = taxBadge && (
        <Badge
            variant="outline"
            className={cn('rounded-none font-normal', {
                'border-success/40 text-success': taxBadge.isFinal,
                'text-muted-foreground': !taxBadge.isFinal,
            })}
        >
            {taxBadge.label}
        </Badge>
    )

    return (
        <li>
            <button
                type="button"
                onClick={() => onSelect(tx.id)}
                aria-current={isSelected}
                aria-label={`${TYPE_LABEL[tx.type]} ${tx.ticker_id} on ${formatDayMonth(tx.buy_date)}`}
                className={cn(
                    'w-full cursor-pointer px-3 py-3 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:bg-accent focus-visible:outline-none md:py-2.5',
                    TRANSACTION_ROW_GRID_CLASS,
                    { 'bg-accent': isSelected }
                )}
            >
                {/* Desktop: one grid row */}
                <span className="hidden flex-col md:flex">
                    <span className="font-medium tabular-nums">{formatDayMonth(tx.buy_date)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {formatTime(tx.buy_date)}
                    </span>
                </span>
                <span className="hidden min-w-0 items-center gap-2.5 md:flex">
                    <AssetLogo logo={ticker?.logo} ticker={tx.ticker_id} />
                    <span className="truncate font-semibold">{tx.ticker_id}</span>
                </span>
                <span className="hidden md:block">{typeBadge}</span>
                <span className="hidden flex-col md:flex">
                    {quantity}
                    {price}
                </span>
                <span className="hidden flex-col items-end md:flex">
                    {value}
                    {valueEur}
                </span>
                <span className="hidden text-right md:block">{fee}</span>
                <span className="hidden justify-end md:flex">{tax}</span>

                {/* Mobile: card layout */}
                <span className="flex flex-col gap-2 md:hidden">
                    <span className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2.5">
                            <AssetLogo logo={ticker?.logo} ticker={tx.ticker_id} />
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate font-semibold">{tx.ticker_id}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {formatDayMonth(tx.buy_date)} · {formatTime(tx.buy_date)}
                                </span>
                            </span>
                        </span>
                        <span className="flex flex-col items-end gap-1">
                            {value}
                            {valueEur}
                        </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-xs">
                        {typeBadge}
                        {hasQuantity && quantity}
                        {price}
                        {tax}
                    </span>
                </span>
            </button>
        </li>
    )
}
