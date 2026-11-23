'use client'

import { useState } from 'react'
import { FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HEADER_BUTTON_CLASS } from '@/components/app-header/app-header.constants'
import { cn } from '@/lib/utils'
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
                className={cn(HEADER_BUTTON_CLASS, 'w-fit')}
            >
                <FileTextIcon className="size-4" />
                <span className="hidden lg:inline">Overview</span>
            </Button>

            <PortfolioExportSheet open={open} onOpenChange={setOpen} overview={overview} />
        </>
    )
}
