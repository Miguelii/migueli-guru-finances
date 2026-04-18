'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Currency,
    TransactionType,
    type Ticker,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/formaters'
import { TYPE_BADGE_VARIANT, TYPE_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { paramsUrlKeys } from '@/lib/searchParams'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    hidePrices: boolean
}

export function TransactionsCard({ transactions, tickerData, hidePrices }: Props) {
    const [selectedAsset, setSelectedAsset] = useQueryState(
        paramsUrlKeys.filter_asset!,
        parseAsString.withDefault('all')
    )

    const currencyMap = new Map<Ticker, Currency>(tickerData.map((td) => [td.ticker, td.currency]))

    const uniqueAssets = Array.from(new Set(transactions.map((tx) => tx.ticker_id))).toSorted(
        (a, b) => a.localeCompare(b)
    )

    const filteredTransactions =
        selectedAsset === 'all'
            ? transactions
            : transactions.filter((tx) => tx.ticker_id === selectedAsset)

    return (
        <Card className="flex w-full lg:w-[60%]! flex-col h-112.5 shadow-sm">
            <CardHeader className="shrink-0 flex flex-row items-center justify-between gap-2">
                <CardTitle>Transactions</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                        {selectedAsset === 'all' ? 'All Assets' : selectedAsset}
                        <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => setSelectedAsset('all')}
                            className={selectedAsset === 'all' ? 'bg-accent' : ''}
                        >
                            All Assets
                        </DropdownMenuItem>
                        {uniqueAssets.map((asset) => (
                            <DropdownMenuItem
                                key={asset}
                                onClick={() => setSelectedAsset(asset)}
                                className={selectedAsset === asset ? 'bg-accent' : ''}
                            >
                                {asset}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Asset</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                            <TableHead className="text-right">Fee</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((tx) => {
                            const currency = currencyMap.get(tx.ticker_id) ?? Currency.EUR
                            return (
                                <TableRow
                                    key={tx.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(tx.buy_date)}
                                    </TableCell>
                                    <TableCell className="font-medium">{tx.ticker_id}</TableCell>
                                    <TableCell>
                                        <Badge variant={TYPE_BADGE_VARIANT[tx.type]}>
                                            {TYPE_LABEL[tx.type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className={cn('text-right tabular-nums', {
                                            'blur-md select-none': hidePrices,
                                        })}
                                    >
                                        {tx.quantity != null && tx.type !== TransactionType.Fee
                                            ? formatQuantity(tx.quantity)
                                            : '—'}
                                    </TableCell>
                                    <TableCell
                                        className={cn('text-right tabular-nums', {
                                            'blur-md select-none': hidePrices,
                                        })}
                                    >
                                        {tx.transaction_price != null
                                            ? formatCurrency(tx.transaction_price, currency)
                                            : '—'}
                                    </TableCell>
                                    <TableCell
                                        className={cn('text-right tabular-nums', {
                                            'blur-md select-none': hidePrices,
                                        })}
                                    >
                                        {tx.value != null
                                            ? formatCurrency(tx.value, currency)
                                            : '—'}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            'text-right tabular-nums text-muted-foreground',
                                            {
                                                'blur-md select-none': hidePrices,
                                            }
                                        )}
                                    >
                                        {formatCurrency(tx.fee, currency)}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
