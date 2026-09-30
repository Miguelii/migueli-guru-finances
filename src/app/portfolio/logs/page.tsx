import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { searchParamsCache } from '@/lib/core/searchParams'
import { LogsExplorer } from '@/modules/logs/logs-explorer'

export const metadata: Metadata = {
    title: 'Logs | Migueli Guru Finances',
}

type Props = PageProps<'/portfolio/logs'>

export default async function LogsPage(props: Props) {
    const [caller, { logs_range: range, logs_search: search }] = await Promise.all([
        createCaller(),
        searchParamsCache.parse(props.searchParams),
    ])

    const fetchedAt = new Date().toISOString()
    const { logs, isTruncated } = await caller.logs.getAll({ range, search })

    return (
        <main className="mb-24 flex min-w-0 flex-col gap-6" id="main">
            <LogsExplorer
                logs={logs}
                isTruncated={isTruncated}
                range={range}
                fetchedAt={fetchedAt}
            />
        </main>
    )
}
