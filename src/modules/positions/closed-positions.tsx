'use client'

import { formatCurrency } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/Transaction'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { PositionAsset } from '@/modules/positions/position-asset'
import { SignedAmount } from '@/modules/positions/signed-amount'

type Props = {
    positions: HoldingSummary[]
    hidePrices: boolean
    onSelect: (id: string) => void
}

export function ClosedPositions({ positions, hidePrices, onSelect }: Props) {
    if (positions.length === 0) return null

    return (
        <PortfolioCard
            cardId="closed-positions"
            title={`Closed positions (${positions.length})`}
            openHeightClassName="h-auto"
            contentClassName="w-full"
        >
            <ul className="flex flex-col divide-y">
                {positions.map((h) => (
                    <li key={h.ticker_id}>
                        <button
                            type="button"
                            onClick={() => onSelect(h.ticker_id)}
                            aria-label={`Open ${h.symbol} details`}
                            className="flex w-full cursor-pointer items-center justify-between gap-3 py-2.5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <PositionAsset
                                holding={h}
                                hidePrices={hidePrices}
                                showQuantity={false}
                            />
                            <span className="flex flex-col items-end gap-0.5">
                                <SignedAmount
                                    value={h.realized_gl_eur}
                                    hidePrices={hidePrices}
                                    className="font-medium"
                                />
                                <span
                                    className={cn('text-xs text-muted-foreground tabular-nums', {
                                        'blur-sm select-none': hidePrices,
                                    })}
                                >
                                    fees {formatCurrency(h.total_fees_eur, Currency.EUR)}
                                </span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </PortfolioCard>
    )
}
