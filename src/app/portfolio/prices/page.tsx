import { PricesSummaryCards } from '@/modules/watchlist/prices-summay-cards'
import { getLatestUpdate } from '@/lib/utils'
import { createCaller } from '@/_trpc/server/caller'
import type { Metadata } from 'next/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Watchlist | Migueli Guru Finances',
}

export default async function PortfolioPage() {
    const trpc = await createCaller()
    const data = await trpc.assets.getAll()

    return (
        <main className="flex flex-col gap-6 mb-24" id="#main">
            <span className="text-xs text-muted-foreground">
                Last Update: {getLatestUpdate(data)}
            </span>
            <PricesSummaryCards data={data} />
        </main>
    )
}
