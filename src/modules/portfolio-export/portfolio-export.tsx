'use client'

import { useState } from 'react'
import { FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPortfolioOverview } from '@/modules/portfolio-export/portfolio-export.helpers'
import type { HoldingSummary } from '@/types/Holding'
import { PortfolioExportSheet } from '@/modules/portfolio-export/portfolio-export-sheet'

type Props = {
    holdings: HoldingSummary[]
}

export function PortfolioExport({ holdings }: Props) {
    const [open, setOpen] = useState(false)
    const overview = createPortfolioOverview(holdings)

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title="Preview portfolio overview"
                aria-label="Preview portfolio overview"
                className="h-9 w-full md:w-fit cursor-pointer px-2.5 flex flex-row gap-1.5 ring-1 ring-foreground/10 bg-background"
            >
                <FileTextIcon className="size-4" />
                <span>Overview</span>
            </Button>

            <PortfolioExportSheet open={open} onOpenChange={setOpen} overview={overview} />
        </>
    )
}
