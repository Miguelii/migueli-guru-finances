'use client'

import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PORTFOLIO_EXPORT_FILENAME } from '@/modules/portfolio-export/portfolio-export.constants'
import { parsePortfolioOverview } from '@/modules/portfolio-export/portfolio-export.helpers'
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    overview: string
}

export function PortfolioExportSheet({ open, onOpenChange, overview }: Props) {
    const overviewLines = parsePortfolioOverview(overview)

    function downloadOverview() {
        const blob = new Blob([overview], {
            type: 'text/plain;charset=utf-8',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = PORTFOLIO_EXPORT_FILENAME
        document.body.append(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 0)
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="data-[swipe-direction=right]:max-w-[60vw]">
                <DrawerHeader className="shrink-0 border-b">
                    <DrawerTitle className="text-lg font-semibold">Portfolio overview</DrawerTitle>
                </DrawerHeader>

                <div className="flex min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    <section
                        aria-label="Portfolio overview preview"
                        className="grid min-h-96 w-full grid-cols-[max-content_3ch_max-content_3ch_max-content_3ch_max-content_3ch_max-content] overflow-auto rounded-lg border border-input bg-muted/20 p-3 font-mono text-xs leading-relaxed text-foreground"
                    >
                        {overviewLines.map((line) => {
                            if (line.kind === 'spacer') {
                                return (
                                    <div
                                        key={line.key}
                                        className="col-span-full h-4"
                                        aria-hidden="true"
                                    />
                                )
                            }

                            if (line.kind === 'category') {
                                return (
                                    <div key={line.key} className="col-span-full font-bold">
                                        {line.name} - {line.percentage}
                                    </div>
                                )
                            }

                            if (line.kind === 'total') {
                                return (
                                    <div key={line.key} className="col-span-full mt-2 font-bold">
                                        Total Invested: {line.value}
                                    </div>
                                )
                            }

                            return (
                                <div key={line.key} className="contents">
                                    <span className="font-semibold">{line.symbol}</span>
                                    <span className="text-center" aria-hidden="true">
                                        |
                                    </span>
                                    <span className="whitespace-nowrap">
                                        Quantity <strong>{line.quantity}</strong>
                                    </span>
                                    <span className="text-center" aria-hidden="true">
                                        |
                                    </span>
                                    <span className="whitespace-nowrap">
                                        AC/Share <strong>{line.averageCost}</strong>
                                    </span>
                                    <span className="text-center" aria-hidden="true">
                                        |
                                    </span>
                                    <span className="whitespace-nowrap">
                                        Allocation <strong>{line.allocation}</strong>
                                    </span>
                                    <span className="text-center" aria-hidden="true">
                                        |
                                    </span>
                                    <span className="whitespace-nowrap">
                                        Invested <strong>{line.invested}</strong>
                                    </span>
                                </div>
                            )
                        })}
                    </section>
                </div>

                <DrawerFooter className="shrink-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <Button
                        type="button"
                        className="h-11 cursor-pointer! md:h-9"
                        onClick={downloadOverview}
                        disabled={!overview}
                    >
                        <DownloadIcon />
                        Download TXT
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
