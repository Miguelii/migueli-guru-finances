import { useMemo, useState } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import { paramsUrlKeys, transactionIdParser, transactionTypeParser } from '@/lib/core/searchParams'
import { ALL_TRANSACTION_ASSETS } from '@/lib/constants/transactions'
import { summarizeTransactions } from '@/lib/portfolio/transactions-summary'
import type {
    CambioRates,
    Currency,
    Ticker,
    TickerData,
    Transaction,
    TransactionType,
} from '@/types/Transaction'
import {
    calculateTransactionInvested,
    filterTransactions,
    groupTransactionsByMonth,
    type TransactionTypeFilter,
} from '@/modules/transactions/transactions-card/transactions-card.helpers'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
}

// Filtered on the client from props: shallow skips the server re-render the adapter default triggers
const CLIENT_ONLY = { shallow: true } as const

export function useTransactionsCard({ transactions, tickerData, rates }: Props) {
    const [selectedAsset, setSelectedAsset] = useQueryState(
        paramsUrlKeys.filter_asset!,
        parseAsString.withDefault(ALL_TRANSACTION_ASSETS).withOptions(CLIENT_ONLY)
    )
    const [selectedType, setSelectedType] = useQueryState(
        paramsUrlKeys.filter_type!,
        transactionTypeParser.withOptions(CLIENT_ONLY)
    )
    const [selectedId, setSelectedId] = useQueryState(
        paramsUrlKeys.transaction_id!,
        transactionIdParser.withOptions(CLIENT_ONLY)
    )

    const tickerMap = useMemo(
        () => new Map<Ticker, TickerData>(tickerData.map((td) => [td.ticker, td])),
        [tickerData]
    )
    const currencyMap = useMemo(
        () => new Map<Ticker, Currency>(tickerData.map((td) => [td.ticker, td.currency])),
        [tickerData]
    )

    const uniqueAssets = useMemo(
        () =>
            Array.from(new Set(transactions.map((tx) => tx.ticker_id))).toSorted((a, b) =>
                a.localeCompare(b)
            ),
        [transactions]
    )
    const availableTypes = useMemo(
        () => Array.from(new Set(transactions.map((tx) => tx.type))) as TransactionType[],
        [transactions]
    )

    // Already sorted by buy_date desc in the repository, and filter keeps that order
    const displayedTransactions = useMemo(
        () => filterTransactions(transactions, selectedAsset, selectedType),
        [transactions, selectedAsset, selectedType]
    )

    const groups = useMemo(
        () =>
            groupTransactionsByMonth(displayedTransactions).map((group) => ({
                ...group,
                summary: summarizeTransactions(group.transactions, currencyMap, rates),
            })),
        [displayedTransactions, currencyMap, rates]
    )

    const summary = useMemo(
        () => summarizeTransactions(displayedTransactions, currencyMap, rates),
        [displayedTransactions, currencyMap, rates]
    )

    const investedByTransaction = useMemo(
        () => calculateTransactionInvested(transactions, tickerData),
        [transactions, tickerData]
    )

    const selected = transactions.find((tx) => tx.id === selectedId) ?? null

    // Keeps the last opened transaction while the drawer plays its closing animation
    const [drawerTransaction, setDrawerTransaction] = useState<Transaction | null>(selected)
    if (selected && selected !== drawerTransaction) setDrawerTransaction(selected)

    return {
        selectedAsset,
        selectedType,
        uniqueAssets,
        availableTypes,
        tickerMap,
        groups,
        summary,
        investedByTransaction,
        selected,
        drawerTransaction,
        hasTransactions: transactions.length > 0,
        changeAsset: (asset: string | null) => {
            if (asset) void setSelectedAsset(asset)
        },
        changeType: (type: TransactionTypeFilter) => void setSelectedType(type),
        selectTransaction: (id: string) => void setSelectedId(id),
        closeDetails: () => void setSelectedId(null),
    }
}
