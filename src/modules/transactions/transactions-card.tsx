'use client'

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
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/formaters'
import { cn } from '@/lib/utils'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { paramsUrlKeys } from '@/lib/searchParams'
import { TransactionDrawer } from '@/modules/transactions/transaction-drawer'
import { DeleteTransactionDialog } from '@/modules/transactions/delete-transaction-dialog'
import { getSellEligibility, getSellEligibilityLabel } from './transactions-card.helpers'
import { TYPE_BADGE_VARIANT, TYPE_LABEL } from './transactions-card.constants'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'

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

    const [createOpen, setCreateOpen] = useState(false)
    const [editing, setEditing] = useState<Transaction | null>(null)
    const [deleting, setDeleting] = useState<Transaction | null>(null)

    const currencyMap = new Map<Ticker, Currency>(tickerData.map((td) => [td.ticker, td.currency]))

    const assetTypeMap = new Map<Ticker, TickerData['type']>(
        tickerData.map((td) => [td.ticker, td.type])
    )

    const uniqueAssets = Array.from(new Set(transactions.map((tx) => tx.ticker_id))).toSorted(
        (a, b) => a.localeCompare(b)
    )

    const filteredTransactions =
        selectedAsset === 'all'
            ? transactions
            : transactions.filter((tx) => tx.ticker_id === selectedAsset)

    return (
        <PortfolioCard
            cardId="transactions"
            title="Transactions"
            className="flex flex-col"
            actions={
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreateOpen(true)}
                        className="cursor-pointer gap-1 rounded-none px-2 py-1.5 text-sm h-8.5"
                    >
                        <Plus className="size-4" />
                        Add
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 rounded-none border border-input bg-background px-2 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
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
                </>
            }
            contentClassName="min-h-0 flex-1 overflow-y-auto"
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Can I Sell</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Fee</TableHead>
                        <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTransactions.map((tx) => {
                        const currency = currencyMap.get(tx.ticker_id) ?? Currency.EUR
                        const sellEligibility = getSellEligibility(
                            tx,
                            assetTypeMap.get(tx.ticker_id)
                        )
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
                                    className={cn('text-xs font-medium', {
                                        'text-success': sellEligibility?.canSell,
                                        'text-muted-foreground': sellEligibility === null,
                                    })}
                                >
                                    {getSellEligibilityLabel(sellEligibility)}
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
                                    {tx.value != null ? formatCurrency(tx.value, currency) : '—'}
                                </TableCell>
                                <TableCell
                                    className={cn('text-right tabular-nums text-muted-foreground', {
                                        'blur-md select-none': hidePrices,
                                    })}
                                >
                                    {formatCurrency(tx.fee, currency)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label="Edit transaction"
                                            className="cursor-pointer"
                                            onClick={() => setEditing(tx)}
                                        >
                                            <Pencil />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label="Delete transaction"
                                            className="cursor-pointer text-destructive hover:text-destructive"
                                            onClick={() => setDeleting(tx)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            <TransactionDrawer
                open={createOpen || editing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCreateOpen(false)
                        setEditing(null)
                    }
                }}
                tickerData={tickerData}
                transactions={transactions}
                transaction={editing}
            />

            <DeleteTransactionDialog
                open={deleting !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleting(null)
                }}
                transaction={deleting}
            />
        </PortfolioCard>
    )
}
