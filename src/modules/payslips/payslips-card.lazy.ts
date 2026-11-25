'use client'

import dynamic from 'next/dynamic'

export const LazyPayslipDrawer = dynamic(
    () => import('@/modules/payslips/payslip-drawer').then((mod) => mod.PayslipDrawer),
    { ssr: false }
)
