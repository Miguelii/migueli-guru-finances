import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getIsDev } from '@/lib/utils/index.server'
import { RevalidateCacheCard } from '@/modules/cache-revalidation/revalidate-cache-card'

export const metadata: Metadata = {
    title: 'Cache | Migueli Guru Finances',
}

export default function CachePage() {
    // Dev tool: the route does not exist outside development
    if (!getIsDev()) notFound()

    return (
        <main className="mb-24 flex flex-col gap-6 w-full" id="main">
            <RevalidateCacheCard />
        </main>
    )
}
