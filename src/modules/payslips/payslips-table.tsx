'use client'

import { Pencil, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { Payslip } from '@/types/Payslip'
import { PAYSLIPS_TABLE_COLUMNS } from '@/modules/payslips/payslips-card.constants'
import {
    formatMonthName,
    getPayslipTotal,
    type PayslipMonthRow,
    type PayslipYearTotals,
} from '@/modules/payslips/payslips-card.helpers'

type Props = {
    year: number
    rows: PayslipMonthRow[]
    totals: PayslipYearTotals
    hidePrices: boolean
    onAdd: (month: number) => void
    onEdit: (payslip: Payslip) => void
}

export function PayslipsTable({ year, rows, totals, hidePrices, onAdd, onEdit }: Props) {
    const blurClass = { 'blur-sm select-none': hidePrices }

    return (
        <Table>
            <caption className="sr-only">Payslips of {year}, one row per month</caption>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    {PAYSLIPS_TABLE_COLUMNS.map((column) => (
                        <TableHead
                            key={column.id}
                            className={cn('text-xs text-muted-foreground', {
                                'text-right': column.align === 'right',
                            })}
                        >
                            {column.id === 'actions' ? (
                                <span className="sr-only">{column.label}</span>
                            ) : (
                                column.label
                            )}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map(({ month, payslip }) => {
                    const monthName = formatMonthName(month)

                    if (!payslip) {
                        return (
                            <TableRow key={month} className="hover:bg-transparent">
                                <TableCell className="py-2.5 pl-3 text-muted-foreground">
                                    {monthName}
                                </TableCell>
                                <TableCell
                                    colSpan={3}
                                    className="text-right text-xs text-muted-foreground"
                                >
                                    Not added yet
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onAdd(month)}
                                        aria-label={`Add payslip for ${monthName} ${year}`}
                                        className="h-8 cursor-pointer gap-1 px-2 text-muted-foreground"
                                    >
                                        <Plus className="size-3.5" />
                                        Add
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    }

                    return (
                        <TableRow
                            key={month}
                            onClick={() => onEdit(payslip)}
                            className="cursor-pointer"
                        >
                            <TableCell className="py-2.5 pl-3">
                                <span className="flex items-center gap-2">
                                    <span className="font-medium">{monthName}</span>
                                    {payslip.note && (
                                        <Badge variant="outline" className="max-w-32 truncate">
                                            {payslip.note}
                                        </Badge>
                                    )}
                                </span>
                            </TableCell>
                            <TableCell className={cn('text-right tabular-nums', blurClass)}>
                                {formatCurrency(payslip.net_salary, Currency.EUR)}
                            </TableCell>
                            <TableCell
                                className={cn(
                                    'text-right text-muted-foreground tabular-nums',
                                    blurClass
                                )}
                            >
                                {formatCurrency(payslip.meal_allowance, Currency.EUR)}
                            </TableCell>
                            <TableCell
                                className={cn('text-right font-semibold tabular-nums', blurClass)}
                            >
                                {formatCurrency(getPayslipTotal(payslip), Currency.EUR)}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        onEdit(payslip)
                                    }}
                                    aria-label={`Edit payslip for ${monthName} ${year}`}
                                    className="cursor-pointer text-muted-foreground"
                                >
                                    <Pencil />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
            <TableFooter>
                <TableRow className="hover:bg-transparent">
                    <TableCell className="py-3 pl-3 font-semibold">Total {year}</TableCell>
                    <TableCell className={cn('text-right font-semibold tabular-nums', blurClass)}>
                        {formatCurrency(totals.netSalary, Currency.EUR)}
                    </TableCell>
                    <TableCell className={cn('text-right font-semibold tabular-nums', blurClass)}>
                        {formatCurrency(totals.mealAllowance, Currency.EUR)}
                    </TableCell>
                    <TableCell className={cn('text-right font-semibold tabular-nums', blurClass)}>
                        {formatCurrency(totals.total, Currency.EUR)}
                    </TableCell>
                    <TableCell />
                </TableRow>
            </TableFooter>
        </Table>
    )
}
