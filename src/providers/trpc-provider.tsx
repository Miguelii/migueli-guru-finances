'use client'

import { useState, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpcClient as trpc } from '@/lib/trpc'
import { unauthorizedLink } from '@/lib/trpc-unauthorized-link'

type Props = PropsWithChildren

export function TrpcContextProvider({ children }: Props) {
    const [queryClient] = useState(() => new QueryClient())
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                unauthorizedLink,
                httpBatchLink({
                    url: '/api/trpc',
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
