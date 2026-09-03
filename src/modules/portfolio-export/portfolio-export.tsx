'use client'

import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PORTFOLIO_EXPORT_FILENAME } from '@/modules/portfolio-export/portfolio-export.constants'
import { createPortfolioOverview } from '@/modules/portfolio-export/portfolio-export.helpers'
import type { HoldingSummary } from '@/types/Holding'

type Props = {
    holdings: HoldingSummary[]
}

export function PortfolioExport({ holdings }: Props) {
    function onClick() {
        const blob = new Blob([createPortfolioOverview(holdings)], {
            type: 'text/plain;charset=utf-8',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = PORTFOLIO_EXPORT_FILENAME
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            title="Download portfolio overview"
            aria-label="Download portfolio overview"
            className="h-9 w-full md:w-fit cursor-pointer px-2.5 flex flex-row gap-1.5 ring-1 ring-foreground/10 bg-background"
        >
            <DownloadIcon className="size-4" />
            <span>Overview</span>
        </Button>
    )
}
