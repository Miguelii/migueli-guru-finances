'use client'

import { useState } from 'react'
import { RotateCcwIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatPercentage, formatQuantity } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency } from '@/types/core/Currency'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { EtfPlanningRow } from '@/modules/etf-planning/etf-planning-row'
import {
    ETF_TARGET_ALLOCATION,
    TARGET_TOTAL_PCT,
} from '@/modules/etf-planning/etf-planning-card.constants'
import {
    getAllocationSegments,
    getEtfPlan,
    getEtfPositions,
    getInitialTargetInputs,
    getTargetSplitLabel,
    isSuggestedBuy,
    parseAmountInput,
    parseTargetInputs,
    toUnits,
    type AllocationSegment,
    type EtfPlan,
} from '@/modules/etf-planning/etf-planning-card.helpers'

type Props = {
    holdings: HoldingSummary[]
    unheldHoldings: HoldingSummary[]
    hidePrices: boolean
}

type SummaryProps = {
    plan: EtfPlan
    hidePrices: boolean
}

type AllocationBarProps = {
    label: string
    segments: AllocationSegment[]
}

const Summary = ({ plan, hidePrices }: SummaryProps) => {
    const splitLabel = getTargetSplitLabel(plan)
    const buys = plan.rows.filter((row) => isSuggestedBuy(row.buyToBalanceEur))
    const blurClass = { 'blur-sm select-none': hidePrices }

    if (plan.targetsSumPct <= 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Set a target % for your ETFs to see how to rebalance
            </p>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                To get back to {splitLabel}
            </span>
            {buys.length === 0 ? (
                <p className="text-2xl font-semibold tracking-tight text-success">On target</p>
            ) : (
                <>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                        Buy{' '}
                        <span className={cn({ 'blur-md select-none': hidePrices })}>
                            {formatCurrency(plan.minBuyToBalanceEur, Currency.EUR)}
                        </span>
                    </p>
                    <ul className="flex flex-col gap-1 text-sm">
                        {buys.map((row) => (
                            <li key={row.holding.ticker_id} className="tabular-nums">
                                <span className={cn('font-semibold', blurClass)}>
                                    {formatCurrency(row.buyToBalanceEur, Currency.EUR)}
                                </span>{' '}
                                of <span className="font-semibold">{row.holding.ticker_id}</span>{' '}
                                <span className={cn('text-muted-foreground', blurClass)}>
                                    (≈{' '}
                                    {formatQuantity(
                                        toUnits(row.buyToBalanceEur, row.unitPriceEur),
                                        2
                                    )}{' '}
                                    units)
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                        Without selling anything: the most overweight ETF sets the size
                    </p>
                </>
            )}
        </div>
    )
}

const AllocationBar = ({ label, segments }: AllocationBarProps) => (
    <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex h-3 overflow-hidden bg-muted" role="img" aria-label={label}>
            {segments.map((segment) => (
                <span
                    key={segment.tickerId}
                    className="block h-full border-r border-background last:border-r-0"
                    title={`${segment.tickerId} ${formatPercentage(segment.pct)}`}
                    style={{ width: `${segment.pct}%`, backgroundColor: segment.color }}
                />
            ))}
        </div>
    </div>
)

export function EtfPlanningCard({ holdings, unheldHoldings, hidePrices }: Props) {
    const positions = getEtfPositions(holdings, unheldHoldings, ETF_TARGET_ALLOCATION)
    const [targetInputs, setTargetInputs] = useState(() =>
        getInitialTargetInputs(positions, ETF_TARGET_ALLOCATION)
    )
    const [contributionInput, setContributionInput] = useState('')

    const plan = getEtfPlan(
        positions,
        parseTargetInputs(targetInputs),
        parseAmountInput(contributionInput)
    )
    const showContribution = plan.contributionEur > 0
    const targetsOff = Math.abs(plan.targetsSumPct - TARGET_TOTAL_PCT) > 0.01

    const handleTargetChange = (tickerId: string, value: string) =>
        setTargetInputs((current) => ({ ...current, [tickerId]: value }))

    const handleReset = () => {
        setTargetInputs(getInitialTargetInputs(positions, ETF_TARGET_ALLOCATION))
        setContributionInput('')
    }

    return (
        <PortfolioCard
            cardId="etf-planning"
            title="ETF Planning"
            className="w-full min-w-0"
            openHeightClassName="h-fit"
            contentClassName="flex flex-col gap-6 w-full"
            actions={
                positions.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span
                            className={cn('text-xs text-muted-foreground tabular-nums', {
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            {formatCurrency(plan.totalEur, Currency.EUR)} in ETFs
                        </span>
                        <Button variant="ghost" size="xs" onClick={handleReset}>
                            <RotateCcwIcon />
                            Reset
                        </Button>
                    </div>
                )
            }
        >
            {positions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ETF positions yet</p>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <Summary plan={plan} hidePrices={hidePrices} />

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <AllocationBar
                                    label="Current"
                                    segments={getAllocationSegments(plan, 'current')}
                                />
                                <AllocationBar
                                    label="Target"
                                    segments={getAllocationSegments(plan, 'target')}
                                />
                            </div>
                            <Field>
                                <FieldLabel htmlFor="etf-contribution">
                                    Planning to invest
                                </FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="etf-contribution"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={contributionInput}
                                        onChange={(event) =>
                                            setContributionInput(event.target.value)
                                        }
                                        className="pr-7 tabular-nums"
                                    />
                                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                                        €
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Split towards the ETFs furthest below their target
                                </p>
                            </Field>
                        </div>
                    </div>

                    {(targetsOff || plan.untargetedHeld.length > 0) && (
                        <ul className="flex flex-col gap-1 border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
                            {targetsOff && (
                                <li className="flex items-center gap-2">
                                    <TriangleAlertIcon className="size-3.5 shrink-0 text-warning" />
                                    Targets add up to {formatPercentage(plan.targetsSumPct)}, not
                                    100%. The plan uses them proportionally
                                </li>
                            )}
                            {plan.untargetedHeld.length > 0 && (
                                <li className="flex items-center gap-2">
                                    <TriangleAlertIcon className="size-3.5 shrink-0 text-warning" />
                                    {plan.untargetedHeld
                                        .map((holding) => holding.ticker_id)
                                        .join(', ')}{' '}
                                    has no target: buying cannot rebalance it, set a % or sell it
                                </li>
                            )}
                        </ul>
                    )}

                    <ul className="flex flex-col divide-y border-t">
                        {plan.rows.map((row) => (
                            <EtfPlanningRow
                                key={row.holding.ticker_id}
                                row={row}
                                targetInput={targetInputs[row.holding.ticker_id] ?? '0'}
                                showContribution={showContribution}
                                hidePrices={hidePrices}
                                onTargetChange={handleTargetChange}
                            />
                        ))}
                    </ul>
                </>
            )}
        </PortfolioCard>
    )
}
