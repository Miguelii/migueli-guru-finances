import type { Metadata } from 'next'
import { MonthlyPurchasesCard } from '@/modules/monthly-purchases/monthly-purchases-card'
import { TransactionsCard } from '@/modules/transactions/transactions-card'
import { searchParamsCache } from '@/lib/core/searchParams'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'

export const metadata: Metadata = {
    title: 'Transactions | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/transactions'>

export default async function TransactionsPage(props: Props) {
    const [{ transactions, data, rates }, searchParams] = await Promise.all([
        getPortfolioData(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <TransactionsCard
                transactions={transactions}
                tickerData={data}
                rates={rates}
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
