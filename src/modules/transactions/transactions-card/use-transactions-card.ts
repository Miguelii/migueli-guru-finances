import { parseAsString, useQueryState } from 'nuqs'
import { paramsUrlKeys } from '@/lib/searchParams'
import type { Currency, Ticker, TickerData, Transaction } from '@/types/Transaction'
import { calculateTransactionInvested } from '@/modules/transactions/transactions-card/transactions-card.helpers'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
}

export function useTransactionsCard({ transactions, tickerData }: Props) {
    // Filtered on the client from props: shallow skips the server re-render the adapter default triggers
    const [selectedAsset, setSelectedAsset] = useQueryState(
        paramsUrlKeys.filter_asset!,
        parseAsString.withDefault('all').withOptions({ shallow: true })
    )

    const currencyMap = new Map<Ticker, Currency>(tickerData.map((td) => [td.ticker, td.currency]))

    const assetTypeMap = new Map<Ticker, TickerData['type']>(
        tickerData.map((td) => [td.ticker, td.type])
    )

    const uniqueAssets = Array.from(new Set(transactions.map((tx) => tx.ticker_id))).toSorted(
        (a, b) => a.localeCompare(b)
    )

    // Already sorted by buy_date desc in the repository, and filter keeps that order
    const displayedTransactions =
        selectedAsset === 'all'
            ? transactions
            : transactions.filter((tx) => tx.ticker_id === selectedAsset)

    const investedByTransaction = calculateTransactionInvested(transactions, tickerData)

    return {
        selectedAsset,
        setSelectedAsset,
        currencyMap,
        assetTypeMap,
        uniqueAssets,
        displayedTransactions,
        investedByTransaction,
    }
}
