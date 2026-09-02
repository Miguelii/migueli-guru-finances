'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { CambioRates, TickerData, Transaction } from '@/types/Transaction'
import { aggregateMonthlyPurchases, aggregateMonthlyPurchasesTotals } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formaters'
import { cn } from '@/lib/utils'
import { parseAsInteger, useQueryState } from 'nuqs'
import { paramsUrlKeys } from '@/lib/searchParams'
import { LogoAvatar } from '@/components/logo-avatar'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    hidePrices: boolean
}

const FIRST_YEAR = 2025

const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
] as const

export function MonthlyPurchasesCard({ transactions, tickerData, rates, hidePrices }: Props) {
    const currentYear = new Date().getFullYear()

    const logoPathByTicker = new Map(
        tickerData.filter((td) => td.logo).map((td) => [td.ticker, td.logo!])
    )

    const [selectedYear, setSelectedYear] = useQueryState(
        paramsUrlKeys.filter_year!,
        parseAsInteger.withDefault(currentYear)
    )

    const years = Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)

    const rows = aggregateMonthlyPurchases(transactions, tickerData, selectedYear)
    const totals = aggregateMonthlyPurchasesTotals(rows, rates)

    return (
        <PortfolioCard
            cardId="monthly-purchases"
            title="Monthly Purchases"
            className="min-w-0"
            openHeightClassName="h-158"
            actions={
                <Select
                    value={String(selectedYear)}
                    onValueChange={(year) => setSelectedYear(Number(year))}
                >
                    <SelectTrigger className="w-24" aria-label="Select year">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            }
        >
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset</TableHead>
                            {MONTH_LABELS.map((month) => (
                                <TableHead key={month} className="text-right">
                                    {month}
                                </TableHead>
                            ))}
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Avg</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={MONTH_LABELS.length + 3}
                                    className="text-center text-muted-foreground"
                                >
                                    No purchases in {selectedYear}
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((row) => {
                            const logoPath = logoPathByTicker.get(row.ticker_id)
                            return (
                                <TableRow key={row.ticker_id}>
                                    <TableCell className="font-medium">
                                        <LogoAvatar
                                            tickerLogo={logoPath}
                                            ticker={row.ticker_id}
                                            tickerCurrency={row.currency}
                                        />
                                    </TableCell>
                                    {row.monthly.map((value, month) => (
                                        <TableCell
                                            key={MONTH_LABELS[month]}
                                            className={cn('text-right tabular-nums', {
                                                'blur-md select-none': hidePrices,
                                                'text-muted-foreground': value === 0,
                                            })}
                                        >
                                            {value !== 0
                                                ? formatCurrency(value, row.currency, 0)
                                                : '—'}
                                        </TableCell>
                                    ))}
                                    <TableCell
                                        className={cn('text-right tabular-nums font-medium', {
                                            'blur-md select-none': hidePrices,
                                        })}
                                    >
                                        {formatCurrency(row.total, row.currency, 0)}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right tabular-nums text-muted-foreground',
                                            {
                                                'blur-md select-none': hidePrices,
                                            }
                                        )}
                                    >
                                        {formatCurrency(row.avg, row.currency, 0)}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {totals.length > 0 && (
                            <TableRow>
                                <TableCell className="font-medium">Total</TableCell>
                                {MONTH_LABELS.map((month, monthIndex) => {
                                    const values = totals
                                        .map((total) => {
                                            const value = total.monthly[monthIndex]!
                                            return value !== 0
                                                ? formatCurrency(value, total.currency, 0)
                                                : null
                                        })
                                        .filter((value): value is string => value !== null)

                                    return (
                                        <TableCell
                                            key={month}
                                            className={cn('text-right tabular-nums font-medium', {
                                                'blur-md select-none': hidePrices,
                                                'text-muted-foreground': values.length === 0,
                                            })}
                                        >
                                            {values.length > 0 ? values.join(' / ') : '—'}
                                        </TableCell>
                                    )
                                })}
                                <TableCell
                                    className={cn('text-right tabular-nums font-medium', {
                                        'blur-md select-none': hidePrices,
                                    })}
                                >
                                    {totals
                                        .map((total) =>
                                            formatCurrency(
                                                total.monthly.reduce(
                                                    (sum, value) => sum + value,
                                                    0
                                                ),
                                                total.currency,
                                                0
                                            )
                                        )
                                        .join(' / ')}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </PortfolioCard>
    )
}
