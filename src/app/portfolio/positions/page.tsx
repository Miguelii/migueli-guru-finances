import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { HoldingsCard } from '@/modules/holdings-table/holdings-card'
import { searchParamsCache } from '@/lib/core/searchParams'
import { getCambioRates, getLatestUpdate } from '@/lib/utils'
import { aggregateHoldings } from '@/lib/portfolio/calculations'

export const metadata: Metadata = {
    title: 'Positions | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/positions'>

export default async function PositionsPage(props: Props) {
    const trpc = await createCaller()

    const [transactions, data, searchParams] = await Promise.all([
        trpc.transactions.getAll(),
        trpc.assets.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices
    const holdings = aggregateHoldings(transactions, data, getCambioRates(data))

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <span className="text-xs text-muted-foreground">
                Last Update: {getLatestUpdate(data)}
            </span>

            <HoldingsCard holdings={holdings} hidePrices={hidePrices} />
        </main>
    )
}
