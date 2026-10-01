'use client'

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import type { HoldingSummary } from '@/types/Holding'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { ClosedPositions } from '@/modules/positions/closed-positions'
import { PositionCard } from '@/modules/positions/position-card'
import { PositionDetails } from '@/modules/positions/position-details'
import { PositionsTable } from '@/modules/positions/positions-table'
import { PositionsToolbar } from '@/modules/positions/positions-toolbar'
import { usePositionsExplorer } from '@/modules/positions/use-positions-explorer'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function PositionsExplorer({ holdings, hidePrices }: Props) {
    const {
        type,
        sortKey,
        includeFees,
        rows,
        closed,
        availableTypes,
        openValueEur,
        selected,
        drawerHolding,
        changeType,
        changeSort,
        toggleFees,
        selectPosition,
        closeDetails,
    } = usePositionsExplorer(holdings)

    return (
        <>
            <PortfolioCard
                cardId="holdings"
                title="Positions"
                className="min-w-0"
                openHeightClassName="h-auto"
                contentClassName="flex w-full min-w-0 flex-col gap-4"
            >
                <PositionsToolbar
                    type={type}
                    availableTypes={availableTypes}
                    sortKey={sortKey}
                    includeFees={includeFees}
                    onTypeChange={changeType}
                    onSortChange={changeSort}
                    onToggleFees={toggleFees}
                />

                {rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No open positions in this category
                    </p>
                ) : (
                    <>
                        <div className="hidden min-w-0 overflow-x-auto md:block">
                            <PositionsTable
                                rows={rows}
                                sortKey={sortKey}
                                includeFees={includeFees}
                                openValueEur={openValueEur}
                                selectedId={selected?.ticker_id ?? null}
                                hidePrices={hidePrices}
                                onSelect={selectPosition}
                            />
                        </div>
                        <ul className="flex flex-col gap-3 md:hidden">
                            {rows.map((holding) => (
                                <PositionCard
                                    key={holding.ticker_id}
                                    holding={holding}
                                    includeFees={includeFees}
                                    openValueEur={openValueEur}
                                    hidePrices={hidePrices}
                                    onSelect={selectPosition}
                                />
                            ))}
                        </ul>
                    </>
                )}
            </PortfolioCard>

            <ClosedPositions positions={closed} hidePrices={hidePrices} onSelect={selectPosition} />

            <Sheet
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) closeDetails()
                }}
            >
                <SheetContent
                    side="right"
                    showCloseButton={false}
                    className="w-full gap-0 p-0 sm:max-w-md"
                >
                    <SheetTitle className="sr-only">Position details</SheetTitle>
                    {drawerHolding && (
                        <PositionDetails
                            holding={drawerHolding}
                            openValueEur={openValueEur}
                            hidePrices={hidePrices}
                            onClose={closeDetails}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
