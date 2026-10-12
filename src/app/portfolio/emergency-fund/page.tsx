import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { searchParamsCache } from '@/lib/core/searchParams'
import { EmergencyFundCard } from '@/modules/emergency-fund/emergency-fund-card'

export const metadata: Metadata = {
    title: 'Emergency Fund | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/emergency-fund'>

export default async function EmergencyFundPage(props: Props) {
    const trpc = await createCaller()

    const [bankBalance, searchParams] = await Promise.all([
        trpc.bank.get(),
        searchParamsCache.parse(props.searchParams),
    ])

    const hidePrices = searchParams.hide_prices

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <EmergencyFundCard summary={bankBalance} hidePrices={hidePrices} />
        </main>
    )
}
