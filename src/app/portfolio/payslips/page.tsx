import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { searchParamsCache } from '@/lib/core/searchParams'
import { PayslipsCard } from '@/modules/payslips/payslips-card'

export const metadata: Metadata = {
    title: 'Payslips | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/payslips'>

export default async function PayslipsPage(props: Props) {
    const trpc = await createCaller()

    const [payslips, searchParams] = await Promise.all([
        trpc.payslips.getAll(),
        searchParamsCache.parse(props.searchParams),
    ])

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <PayslipsCard payslips={payslips} hidePrices={searchParams.hide_prices} />
        </main>
    )
}
