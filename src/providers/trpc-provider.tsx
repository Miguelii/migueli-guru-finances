'use client'

import { useState, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpcClient as trpc } from '@/lib/trpc'
import { unauthorizedLink } from '@/lib/trpc/trpc-unauthorized-link'
import { TRPC_API_PATH } from '@/lib/constants'

type Props = PropsWithChildren

export function TrpcContextProvider({ children }: Props) {
    const [queryClient] = useState(() => new QueryClient())
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                unauthorizedLink,
                httpBatchLink({
                    url: TRPC_API_PATH,
                }),
            ],
        })
    )

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    )
}
