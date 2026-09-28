import 'server-only'

import { cache } from 'react'
import { createCaller } from '@/_bff/trpc/caller'
import { aggregateHoldings } from '@/lib/portfolio/calculations'
import { getCambioRates } from '@/lib/utils'

/**
 * Loads transactions and ticker data and aggregates the holdings once per request.
 *
 * Wrapped in React `cache()` so `/portfolio/layout.tsx` and the page rendered inside it
 * (in parallel) share one promise: after a mutation invalidates the `unstable_cache`
 * entries, both would otherwise miss at once and query Supabase twice.
 */
export const getPortfolioData = cache(async () => {
    const trpc = await createCaller()

    const [transactions, data] = await Promise.all([
        trpc.transactions.getAll(),
        trpc.assets.getAll(),
    ])

    const rates = getCambioRates(data)

    return { transactions, data, rates, holdings: aggregateHoldings(transactions, data, rates) }
})
