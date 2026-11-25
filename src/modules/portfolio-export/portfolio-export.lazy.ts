'use client'

import dynamic from 'next/dynamic'

export const LazyPortfolioExportSheet = dynamic(
    () =>
        import('@/modules/portfolio-export/portfolio-export-sheet').then(
            (mod) => mod.PortfolioExportSheet
        ),
    { ssr: false }
)
