'use client'

import dynamic from 'next/dynamic'

export const LazyTransactionDrawer = dynamic(
    () => import('@/modules/transactions/transaction-drawer').then((mod) => mod.TransactionDrawer),
    { ssr: false }
)
