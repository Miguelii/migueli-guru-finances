import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { MonthlyPurchasesCard } from '@/modules/monthly-purchases/monthly-purchases-card'
import { TransactionsCard } from '@/modules/transactions/transactions-card'
import { searchParamsCache } from '@/lib/searchParams'
import { getCambioRates, getLatestUpdate } from '@/lib/utils'

export const metadata: Metadata = {
    title: 'Transactions | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/transactions'>

export default async function TransactionsPage(props: Props) {
    const trpc = await createCaller()

    const [transactions, data, searchParams] = await Promise.all([
        trpc.transactions.getAll(),
        trpc.assets.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices
    const rates = getCambioRates(data)

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <span className="text-xs text-muted-foreground">
                Last Update: {getLatestUpdate(data)}
            </span>

            <TransactionsCard
                transactions={transactions}
                tickerData={data}
                hidePrices={hidePrices}
            />
            <MonthlyPurchasesCard
                transactions={transactions}
                tickerData={data}
                rates={rates}
                hidePrices={hidePrices}
            />
        </main>
    )
}
