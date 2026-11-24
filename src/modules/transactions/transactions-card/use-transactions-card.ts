import { useEffect, useMemo, useRef, useState } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import { paramsUrlKeys, transactionIdParser, transactionTypeParser } from '@/lib/core/searchParams'
import { ALL_TRANSACTION_ASSETS } from '@/lib/constants/transactions'
import { summarizeTransactions } from '@/lib/portfolio/transactions-summary'
import { buildFifoLedger } from '@/lib/portfolio/fifo-ledger'
import type { CambioRates, TickerData, Transaction } from '@/types/Transaction'
import type { Currency } from '@/types/core/Currency'
import type { Ticker } from '@/types/core/Ticker'
import {
    calculateTransactionInvested,
    filterTransactions,
    groupTransactionsByMonth,
    type TransactionTypeFilter,
} from '@/modules/transactions/transactions-card/transactions-card.helpers'
import { HIGHLIGHT_DURATION_MS } from '@/modules/transactions/transactions-card/transactions-card.constants'
import { getTransactionRowId } from '@/modules/transactions/transaction-row.helpers'

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
        () => Array.from(new Set(transactions.map((tx) => tx.type))),
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

    // Built from every transaction: filtering first would change which lots each sale consumes
    const fifoLedger = useMemo(
        () => buildFifoLedger(transactions, tickerData, rates),
        [transactions, tickerData, rates]
    )

    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const clearHighlightTimeout = () => {
        if (highlightTimeout.current) clearTimeout(highlightTimeout.current)
    }
    useEffect(() => clearHighlightTimeout, [])

    // Scrolls to a FIFO-linked row and flashes it; opens its details when the filters hide it
    const jumpToTransaction = (id: string) => {
        const row = document.querySelector<HTMLElement>(`#${getTransactionRowId(id)}`)

        if (!row) {
            void setSelectedId(id)
            return
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        row.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' })
        row.querySelector('button')?.focus({ preventScroll: true })

        setHighlightedId(id)
        clearHighlightTimeout()
        highlightTimeout.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_DURATION_MS)
    }

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
        fifoLedger,
        highlightedId,
        selected,
        drawerTransaction,
        hasTransactions: transactions.length > 0,
        changeAsset: (asset: string | null) => {
            if (asset) void setSelectedAsset(asset)
        },
        changeType: (type: TransactionTypeFilter) => void setSelectedType(type),
        selectTransaction: (id: string) => void setSelectedId(id),
        jumpToTransaction,
        closeDetails: () => void setSelectedId(null),
    }
}
