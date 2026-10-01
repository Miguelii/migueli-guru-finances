'use client'

import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeltaBadge } from '@/components/ui/delta-badge'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import { formatCurrency, formatQuantity } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/Transaction'
import { getPositionWeight } from '@/modules/positions/positions.helpers'
import { PositionAsset } from '@/modules/positions/position-asset'
import { SignedAmount } from '@/modules/positions/signed-amount'

type Props = {
    holding: HoldingSummary
    openValueEur: number
    hidePrices: boolean
    onClose: () => void
}

type SectionProps = {
    title: string
    children: React.ReactNode
}

type RowProps = {
    label: string
    children: React.ReactNode
}

const Section = ({ title, children }: SectionProps) => (
    <section className="flex flex-col gap-1">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {title}
        </h3>
        <dl className="flex flex-col">{children}</dl>
    </section>
)

const Row = ({ label, children }: RowProps) => (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="flex items-center gap-2 text-right text-sm font-medium tabular-nums">
            {children}
        </dd>
    </div>
)

export function PositionDetails({ holding: h, openValueEur, hidePrices, onClose }: Props) {
    const isNative = h.currency !== Currency.EUR
    const blurClass = { 'blur-sm select-none': hidePrices }
    const isOpen = h.total_quantity > 0

    const withNative = (eur: number, native: number) => (
        <span className={cn('flex flex-col items-end', blurClass)}>
            {formatCurrency(eur, Currency.EUR)}
            {isNative && (
                <span className="text-xs font-normal text-muted-foreground">
                    {formatCurrency(native, h.currency)}
                </span>
            )}
        </span>
    )

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <PositionAsset holding={h} hidePrices={hidePrices} showQuantity={false} />
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                            aria-hidden="true"
                            className={cn('size-2', ASSET_TYPE_META[h.tickerType].bgClassName)}
                        />
                        {ASSET_TYPE_META[h.tickerType].label}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close details"
                        className="size-7 cursor-pointer"
                    >
                        <XIcon />
                    </Button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Market value</span>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn('text-3xl font-semibold tracking-tight tabular-nums', {
                                'blur-md select-none': hidePrices,
                            })}
                        >
                            {formatCurrency(h.current_value_eur, Currency.EUR)}
                        </span>
                        {isOpen && <DeltaBadge value={h.unrealized_gl_eur_pct} />}
                    </div>
                </div>

                <Section title="Position">
                    <Row label="Quantity">
                        <span className={cn(blurClass)}>
                            {formatQuantity(h.total_quantity, 10)}
                        </span>
                    </Row>
                    <Row label="Avg cost per share">
                        <span className={cn(blurClass)}>
                            {formatCurrency(h.avg_cost_per_share, h.currency, 5)}
                        </span>
                    </Row>
                    <Row label="Current price">{formatCurrency(h.current_price, h.currency)}</Row>
                    <Row label="Weight">{getPositionWeight(h, openValueEur).toFixed(1)}%</Row>
                </Section>

                <Section title="Value">
                    <Row label="Market value">
                        {withNative(h.current_value_eur, h.current_value)}
                    </Row>
                    <Row label="Invested">{withNative(h.total_invested_eur, h.total_invested)}</Row>
                    <Row label="Fees">{withNative(h.total_fees_eur, h.total_fees)}</Row>
                </Section>

                <Section title="Performance">
                    <Row label="Unrealized">
                        <SignedAmount value={h.unrealized_gl_eur} hidePrices={hidePrices} />
                        <DeltaBadge value={h.unrealized_gl_eur_pct} />
                    </Row>
                    <Row label="Unrealized (w/ fees)">
                        <SignedAmount
                            value={h.unrealized_gl_with_fees_eur}
                            hidePrices={hidePrices}
                        />
                        <DeltaBadge value={h.unrealized_gl_with_fees_eur_pct} />
                    </Row>
                    <Row label="Realized">
                        <SignedAmount value={h.realized_gl_eur} hidePrices={hidePrices} />
                    </Row>
                    <Row label="Total G/L">
                        <SignedAmount
                            value={h.total_gl_eur}
                            hidePrices={hidePrices}
                            className="font-semibold"
                        />
                    </Row>
                </Section>
            </div>
        </div>
    )
}
