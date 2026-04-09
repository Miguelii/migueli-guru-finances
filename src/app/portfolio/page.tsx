import { getAllTransactions } from '@/services/get-all-transactions'
import { aggregateHoldings } from '@/lib/calculations'
import { TransactionsCard } from '@/components/transactions-card'
import { getAssets } from '@/services/get-assets'
import { AllocationCardWithChart } from '@/components/allocation-card-with-chart'
import { HoldingsCard } from '@/components/holdings-card'
import type { Metadata } from 'next'
import { PortfolioSummaryCards } from '@/components/portfolio-summary-cards'
import { Ticker, type CambioRates } from '@/types/Transaction'
import { searchParamsCache } from '@/lib/searchParams'
import { getLatestUpdate } from '@/lib/utils'
import { RefreshApp } from '@/components/refresh-app'

export const metadata: Metadata = {
    title: 'Portfolio | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio'>

export default async function PortfolioPage(props: Props) {
    const [transactions, data, searchParams] = await Promise.all([
        getAllTransactions(),
        getAssets(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    const holdings = aggregateHoldings(transactions, data)

    const rates: CambioRates = {
        usdToEur: data.find((item) => item.ticker === Ticker.USD_EUR)?.curr_price ?? 1,
        usdcToEur: data.find((item) => item.ticker === Ticker.USDC_EUR)?.curr_price ?? 1,
    }

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="#main">
            <div className="flex flex-row gap-6 justify-between items-center">
                <span className="text-xs text-muted-foreground">
                    Last Update: {getLatestUpdate(data)}
                </span>
                <RefreshApp />
            </div>

            <PortfolioSummaryCards holdings={holdings} rates={rates} hidePrices={hidePrices} />

            <section className="flex flex-col lg:flex-row gap-6">
                <TransactionsCard
                    transactions={transactions}
                    tickerData={data}
                    hidePrices={hidePrices}
                />
                <AllocationCardWithChart
                    holdings={holdings}
                    rates={rates}
                    hidePrices={hidePrices}
                />
            </section>

            <HoldingsCard holdings={holdings} hidePrices={hidePrices} rates={rates} />
        </main>
    )
}
