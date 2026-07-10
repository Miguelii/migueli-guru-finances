import { createCaller } from '@/_trpc/server/caller'
import { aggregateHoldings } from '@/lib/calculations'
import { TransactionsCard } from '@/modules/transactions/transactions-card'
import type { Metadata } from 'next'
import { PortfolioSummaryCards } from '@/modules/summary/portfolio-summary-cards'
import { searchParamsCache } from '@/lib/searchParams'
import { getCambioRates, getLatestUpdate } from '@/lib/utils'
import { RefreshApp } from '@/components/refresh-app'
import { AllocationCardWithChart } from '@/modules/allocation-chart/allocation-card-with-chart'
import { TypeAllocationCardWithChart } from '@/modules/type-allocation-chart/type-allocation-card-with-chart'
import { HoldingsCard } from '@/modules/holdings-table/holdings-card'
import { MonthlyPurchasesCard } from '@/modules/monthly-purchases/monthly-purchases-card'

export const metadata: Metadata = {
    title: 'Portfolio | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio'>

export default async function PortfolioPage(props: Props) {
    const trpc = await createCaller()

    const [transactions, data, searchParams] = await Promise.all([
        trpc.transactions.getAll(),
        trpc.assets.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    const rates = getCambioRates(data)

    const holdings = aggregateHoldings(transactions, data, rates)

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="#main">
            <div className="flex flex-row gap-6 justify-between items-center">
                <span className="text-xs text-muted-foreground">
                    Last Update: {getLatestUpdate(data)}
                </span>
                <RefreshApp />
            </div>

            <PortfolioSummaryCards holdings={holdings} hidePrices={hidePrices} />

            <section className="flex flex-col lg:flex-row gap-6">
                <AllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />
                <TypeAllocationCardWithChart holdings={holdings} hidePrices={hidePrices} />
            </section>

            <TransactionsCard
                transactions={transactions}
                tickerData={data}
                hidePrices={hidePrices}
            />

            <MonthlyPurchasesCard
                transactions={transactions}
                tickerData={data}
                hidePrices={hidePrices}
            />

            <HoldingsCard holdings={holdings} hidePrices={hidePrices} />
        </main>
    )
}
