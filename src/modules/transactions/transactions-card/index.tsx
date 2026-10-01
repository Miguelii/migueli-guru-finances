'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency, type CambioRates, type TickerData, type Transaction } from '@/types/Transaction'
import { DeleteTransactionDialog } from '@/modules/transactions/delete-transaction-dialog'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { TransactionDetails } from '@/modules/transactions/transaction-details'
import { TransactionDrawer } from '@/modules/transactions/transaction-drawer'
import { TransactionRow } from '@/modules/transactions/transaction-row'
import { TRANSACTION_ROW_GRID_CLASS } from '@/modules/transactions/transaction-row.constants'
import { TransactionsToolbar } from '@/modules/transactions/transactions-toolbar'
import {
    TRANSACTION_COLUMNS,
    TRANSACTIONS_CARD_HEIGHT_CLASS,
} from '@/modules/transactions/transactions-card/transactions-card.constants'
import { useTransactionsCard } from '@/modules/transactions/transactions-card/use-transactions-card'
import { useTransactionsCardActions } from '@/modules/transactions/transactions-card/use-transactions-card-actions'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    hidePrices: boolean
}

export function TransactionsCard({ transactions, tickerData, rates, hidePrices }: Props) {
    const {
        selectedAsset,
        selectedType,
        uniqueAssets,
        availableTypes,
        tickerMap,
        groups,
        investedByTransaction,
        selected,
        drawerTransaction,
        hasTransactions,
        changeAsset,
        changeType,
        selectTransaction,
        closeDetails,
    } = useTransactionsCard({ transactions, tickerData, rates })

    const {
        isDrawerOpen,
        isDeleteDialogOpen,
        editing,
        deleting,
        openCreate,
        openEdit,
        openDelete,
        onDrawerOpenChange,
        onDeleteDialogOpenChange,
    } = useTransactionsCardActions()

    return (
        <>
            <PortfolioCard
                cardId="transactions"
                title="Transactions"
                className="flex flex-col min-w-0"
                openHeightClassName={TRANSACTIONS_CARD_HEIGHT_CLASS}
                actions={
                    <Button
                        size="sm"
                        onClick={openCreate}
                        className="h-8 cursor-pointer gap-1 rounded-none px-2.5"
                    >
                        <Plus className="size-4" />
                        Add
                    </Button>
                }
                contentClassName="flex h-full min-h-0 w-full min-w-0 flex-col gap-4"
            >
                <TransactionsToolbar
                    asset={selectedAsset}
                    type={selectedType}
                    assets={uniqueAssets}
                    availableTypes={availableTypes}
                    tickerMap={tickerMap}
                    onAssetChange={changeAsset}
                    onTypeChange={changeType}
                />

                {groups.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                            {hasTransactions
                                ? 'No transactions match these filters'
                                : 'No transactions yet'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {hasTransactions
                                ? 'Change the asset or type filter.'
                                : 'Add your first buy to start tracking your portfolio.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                        {/* Outside the scroll area so it stays put; same gutter keeps the columns aligned */}
                        <div
                            aria-hidden="true"
                            className={cn(
                                'hidden overflow-y-hidden border-b px-3 pb-2 text-xs text-muted-foreground [scrollbar-gutter:stable]',
                                TRANSACTION_ROW_GRID_CLASS
                            )}
                        >
                            {TRANSACTION_COLUMNS.map((column) => (
                                <span
                                    key={column.label}
                                    className={cn({ 'text-right': column.align === 'right' })}
                                >
                                    {column.label}
                                </span>
                            ))}
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                            {groups.map((group) => (
                                <section
                                    key={group.key}
                                    aria-labelledby={`transactions-${group.key}`}
                                    className="flex flex-col"
                                >
                                    <header className="sticky top-0 z-10 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b bg-muted px-3 py-2">
                                        <h3
                                            id={`transactions-${group.key}`}
                                            className="text-xs font-semibold tracking-wide uppercase"
                                        >
                                            {group.label}
                                        </h3>
                                        <p className="text-xs text-muted-foreground tabular-nums">
                                            {group.summary.count}{' '}
                                            {group.summary.count === 1
                                                ? 'transaction'
                                                : 'transactions'}
                                            {group.summary.boughtEur > 0 && (
                                                <>
                                                    {' · '}
                                                    <span
                                                        className={cn({
                                                            'blur-sm select-none': hidePrices,
                                                        })}
                                                    >
                                                        {formatCurrency(
                                                            group.summary.boughtEur,
                                                            Currency.EUR
                                                        )}
                                                    </span>{' '}
                                                    bought
                                                </>
                                            )}
                                        </p>
                                    </header>
                                    <ul className="flex flex-col divide-y">
                                        {group.transactions.map((tx) => (
                                            <TransactionRow
                                                key={tx.id}
                                                transaction={tx}
                                                ticker={tickerMap.get(tx.ticker_id)}
                                                rates={rates}
                                                isSelected={selected?.id === tx.id}
                                                hidePrices={hidePrices}
                                                onSelect={selectTransaction}
                                            />
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    </div>
                )}
            </PortfolioCard>

            <Sheet
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) closeDetails()
                }}
            >
                <SheetContent
                    side="right"
                    showCloseButton={false}
                    className="w-full gap-0 p-0 sm:max-w-md"
                >
                    <SheetTitle className="sr-only">Transaction details</SheetTitle>
                    {drawerTransaction && (
                        <TransactionDetails
                            transaction={drawerTransaction}
                            ticker={tickerMap.get(drawerTransaction.ticker_id)}
                            rates={rates}
                            investedAfter={investedByTransaction.get(drawerTransaction.id)}
                            hidePrices={hidePrices}
                            onEdit={(tx) => {
                                closeDetails()
                                openEdit(tx)
                            }}
                            onDelete={(tx) => {
                                closeDetails()
                                openDelete(tx)
                            }}
                            onClose={closeDetails}
                        />
                    )}
                </SheetContent>
            </Sheet>

            <TransactionDrawer
                open={isDrawerOpen}
                onOpenChange={onDrawerOpenChange}
                tickerData={tickerData}
                transactions={transactions}
                transaction={editing}
            />

            <DeleteTransactionDialog
                open={isDeleteDialogOpen}
                onOpenChange={onDeleteDialogOpenChange}
                transaction={deleting}
            />
        </>
    )
}
