'use client'

import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PORTFOLIO_EXPORT_FILENAME } from '@/modules/portfolio-export/portfolio-export.constants'
import { parsePortfolioOverview } from '@/modules/portfolio-export/portfolio-export.helpers'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[95vw] max-w-[95vw] overflow-y-auto sm:w-[60vw]! sm:max-w-[60vw]!"
            >
                <SheetHeader>
                    <SheetTitle className="text-lg font-semibold">Portfolio overview</SheetTitle>
                </SheetHeader>

                <div className="flex flex-1 px-4 pb-4">
                    <section
                        aria-label="Portfolio overview preview"
                        className="grid min-h-96 w-full grid-cols-[max-content_3ch_max-content_3ch_max-content_3ch_max-content_3ch_max-content] overflow-auto rounded-none border border-input bg-muted/20 p-3 font-mono text-xs leading-relaxed text-foreground"
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

                <SheetFooter className="px-4 pt-0">
                    <Button
                        type="button"
                        className="cursor-pointer!"
                        onClick={downloadOverview}
                        disabled={!overview}
                    >
                        <DownloadIcon />
                        Download TXT
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
