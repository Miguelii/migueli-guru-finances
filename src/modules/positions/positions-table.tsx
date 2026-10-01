'use client'

import { DeltaBadge } from '@/components/ui/delta-badge'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import type { PositionSortKey } from '@/lib/constants/positions'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/Transaction'
import { getPositionWeight, getUnrealized } from '@/modules/positions/positions.helpers'
import { getColumnAriaSort, getTableTotals } from '@/modules/positions/positions-table.helpers'
import { POSITIONS_TABLE_COLUMNS } from '@/modules/positions/positions-table.constants'
import { PositionAsset } from '@/modules/positions/position-asset'
import { SignedAmount } from '@/modules/positions/signed-amount'

type Props = {
    rows: HoldingSummary[]
    sortKey: PositionSortKey
    includeFees: boolean
    openValueEur: number
    selectedId: string | null
    hidePrices: boolean
    onSelect: (id: string) => void
}

type StackProps = {
    primary: React.ReactNode
    secondary?: React.ReactNode
}

const Stack = ({ primary, secondary }: StackProps) => (
    <span className="flex flex-col items-end gap-0.5">
        <span className="font-medium tabular-nums">{primary}</span>
        {secondary && (
            <span className="text-xs text-muted-foreground tabular-nums">{secondary}</span>
        )}
    </span>
)

export function PositionsTable({
    rows,
    sortKey,
    includeFees,
    openValueEur,
    selectedId,
    hidePrices,
    onSelect,
}: Props) {
    const totals = getTableTotals(rows, includeFees)
    const blurClass = { 'blur-sm select-none': hidePrices }

    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    {POSITIONS_TABLE_COLUMNS.map((column) => (
                        <TableHead
                            key={column.id}
                            aria-sort={getColumnAriaSort(column.id, sortKey)}
                            className={cn('text-xs text-muted-foreground', {
                                'text-right': column.align === 'right',
                                'text-foreground':
                                    getColumnAriaSort(column.id, sortKey) !== undefined,
                            })}
                        >
                            {column.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((h) => {
                    const unrealized = getUnrealized(h, includeFees)
                    const weight = getPositionWeight(h, openValueEur)
                    const isNative = h.currency !== Currency.EUR

                    return (
                        <TableRow
                            key={h.ticker_id}
                            onClick={() => onSelect(h.ticker_id)}
                            data-state={selectedId === h.ticker_id ? 'selected' : undefined}
                            className="cursor-pointer"
                        >
                            <TableCell className="relative py-3 pl-4">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute inset-y-2 left-0 w-0.5',
                                        ASSET_TYPE_META[h.tickerType].bgClassName
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onSelect(h.ticker_id)
                                    }}
                                    aria-label={`Open ${h.symbol} details`}
                                    className="cursor-pointer rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <PositionAsset holding={h} hidePrices={hidePrices} />
                                </button>
                            </TableCell>
                            <TableCell className="text-right">
                                <Stack
                                    primary={formatCurrency(h.current_price, h.currency)}
                                    secondary={
                                        <span className={cn(blurClass)}>
                                            AC {formatCurrency(h.avg_cost_per_share, h.currency)}
                                        </span>
                                    }
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="flex flex-col items-end gap-1">
                                    <span className={cn('font-medium tabular-nums', blurClass)}>
                                        {formatCurrency(h.current_value_eur, Currency.EUR)}
                                    </span>
                                    {isNative && (
                                        <span
                                            className={cn(
                                                'text-xs text-muted-foreground tabular-nums',
                                                blurClass
                                            )}
                                        >
                                            {formatCurrency(h.current_value, h.currency)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-1 w-14 overflow-hidden bg-muted">
                                            <span
                                                className={cn(
                                                    'block h-full',
                                                    ASSET_TYPE_META[h.tickerType].bgClassName
                                                )}
                                                style={{ width: `${weight}%` }}
                                            />
                                        </span>
                                        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                                            {weight.toFixed(1)}%
                                        </span>
                                    </span>
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <Stack
                                    primary={
                                        <span className={cn(blurClass)}>
                                            {formatCurrency(h.total_invested_eur, Currency.EUR)}
                                        </span>
                                    }
                                    secondary={
                                        <span className={cn(blurClass)}>
                                            fees {formatCurrency(h.total_fees_eur, Currency.EUR)}
                                        </span>
                                    }
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="flex flex-col items-end gap-1">
                                    <SignedAmount
                                        value={unrealized.value}
                                        hidePrices={hidePrices}
                                        className="font-medium"
                                    />
                                    <DeltaBadge value={unrealized.pct} />
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <SignedAmount value={h.realized_gl_eur} hidePrices={hidePrices} />
                            </TableCell>
                            <TableCell className="text-right">
                                <SignedAmount
                                    value={h.total_gl_eur}
                                    hidePrices={hidePrices}
                                    className="font-semibold"
                                />
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
            {rows.length > 1 && (
                <TableFooter>
                    <TableRow className="hover:bg-transparent">
                        <TableCell className="pl-4 text-xs font-medium text-muted-foreground uppercase">
                            Total
                        </TableCell>
                        <TableCell />
                        <TableCell
                            className={cn('text-right font-semibold tabular-nums', blurClass)}
                        >
                            {formatCurrency(totals.currentValue, Currency.EUR)}
                        </TableCell>
                        <TableCell
                            className={cn('text-right font-semibold tabular-nums', blurClass)}
                        >
                            {formatCurrency(totals.totalInvested, Currency.EUR)}
                        </TableCell>
                        <TableCell className="text-right">
                            <SignedAmount
                                value={totals.unrealized}
                                hidePrices={hidePrices}
                                className="font-semibold"
                            />
                        </TableCell>
                        <TableCell className="text-right">
                            <SignedAmount
                                value={totals.realized}
                                hidePrices={hidePrices}
                                className="font-semibold"
                            />
                        </TableCell>
                        <TableCell className="text-right">
                            <SignedAmount
                                value={totals.totalGl}
                                hidePrices={hidePrices}
                                className="font-semibold"
                            />
                        </TableCell>
                    </TableRow>
                </TableFooter>
            )}
        </Table>
    )
}
