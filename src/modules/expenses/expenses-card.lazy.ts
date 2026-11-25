'use client'

import dynamic from 'next/dynamic'

export const LazyAddExpenseDrawer = dynamic(
    () => import('@/modules/expenses/add-expense-drawer').then((mod) => mod.AddExpenseDrawer),
    { ssr: false }
)
