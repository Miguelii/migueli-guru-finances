import { TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DeltaBadge } from '@/components/ui/delta-badge'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { computeAnnualizedReturn } from '@/lib/portfolio/annualized-return'
import { computePortfolioTotals } from '@/lib/portfolio/calculations'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import { formatCurrency, formatMonthTick, formatPercentage } from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import type { HoldingSummary } from '@/types/Holding'
import { Currency, type CambioRates, type TickerData, type Transaction } from '@/types/Transaction'
import { PROJECTION_MONTHS } from '@/modules/planning/planning-card.constants'
import {
    buildScenarios,
    formatMonthlyContribution,
    getYearOpening,
    resolveProjectionRate,
    type Scenario,
    type ScenarioMilestone,
} from '@/modules/planning/planning-card.helpers'
import { ProjectionChart } from '@/modules/planning/projection-chart'

type Props = {
    holdings: HoldingSummary[]
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    snapshots: PortfolioSnapshotPoint[]
    hidePrices: boolean
}

type ScenarioRowProps = {
    scenario: Scenario
    baseContributionEur: number
    hidePrices: boolean
}

type HorizonBlockProps = {
    milestone: ScenarioMilestone
    isBase: boolean
    hidePrices: boolean
}

type ValueRowProps = {
    label: string
    value: number
    hidePrices: boolean
    isSigned?: boolean
}

type TodayStatProps = {
    label: string
    value: number
    hidePrices: boolean
    isSigned?: boolean
    isLarge?: boolean
}

const currency = Currency.EUR

const ValueRow = ({ label, value, hidePrices, isSigned = false }: ValueRowProps) => {
    const tone = getDeltaTone(value)

    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
                className={cn('font-medium tabular-nums', {
                    'text-success': isSigned && tone === 'positive',
                    'text-destructive': isSigned && tone === 'negative',
                    'blur-sm select-none': hidePrices,
                })}
            >
                {isSigned && value > 0 && '+'}
                {formatCurrency(value, currency, 0)}
            </dd>
        </div>
    )
}

const TodayStat = ({
    label,
    value,
    hidePrices,
    isSigned = false,
    isLarge = false,
}: TodayStatProps) => {
    const tone = getDeltaTone(value)

    return (
        <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd
                className={cn('truncate font-semibold tabular-nums', {
                    'text-sm': !isLarge,
                    'text-lg tracking-tight': isLarge,
                    'text-success': isSigned && tone === 'positive',
                    'text-destructive': isSigned && tone === 'negative',
                    'blur-md select-none': hidePrices,
                })}
            >
                {isSigned && value > 0 && '+'}
                {formatCurrency(value, currency, 0)}
            </dd>
        </div>
    )
}

const HorizonBlock = ({ milestone, isBase, hidePrices }: HorizonBlockProps) => (
    <div className="flex min-w-0 flex-col gap-2">
        <h4 className="text-xs text-muted-foreground">
            {milestone.label} · {formatMonthTick(milestone.month)}
        </h4>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p
                className={cn('text-2xl font-semibold tracking-tight tabular-nums', {
                    'blur-md select-none': hidePrices,
                })}
            >
                {formatCurrency(milestone.valueEur, currency, 0)}
            </p>
            <DeltaBadge value={milestone.changePct} />
        </div>
        <dl className="flex flex-col gap-1 text-xs">
            <ValueRow
                label="Deposits"
                value={milestone.depositsEur}
                hidePrices={hidePrices}
                isSigned
            />
            <ValueRow label="Growth" value={milestone.growthEur} hidePrices={hidePrices} isSigned />
            {!isBase && (
                <ValueRow
                    label="vs base"
                    value={milestone.differenceEur}
                    hidePrices={hidePrices}
                    isSigned
                />
            )}
        </dl>
    </div>
)

const ScenarioRow = ({ scenario, baseContributionEur, hidePrices }: ScenarioRowProps) => {
    const isBase = scenario.monthlyContributionEur === baseContributionEur
    const horizons = scenario.milestones.filter((milestone) => milestone.offset > 0)

    return (
        <li className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-6 lg:p-6">
            <div className="flex items-center gap-2 sm:flex-col sm:items-start">
                <h3 className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                    <span
                        aria-hidden="true"
                        className={cn('size-2.5 shrink-0', scenario.swatchClassName)}
                    />
                    {formatMonthlyContribution(scenario.monthlyContributionEur)}
                </h3>
                {isBase && <Badge variant="outline">Base</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:contents">
                {horizons.map((milestone) => (
                    <HorizonBlock
                        key={milestone.offset}
                        milestone={milestone}
                        isBase={isBase}
                        hidePrices={hidePrices}
                    />
                ))}
            </div>
        </li>
    )
}

export function PlanningCard({
    holdings,
    transactions,
    tickerData,
    rates,
    snapshots,
    hidePrices,
}: Props) {
    if (transactions.length === 0) {
        return (
            <Card className="grid h-64 place-items-center px-4 text-center text-sm text-muted-foreground">
                Add transactions to see a projection
            </Card>
        )
    }

    const totals = computePortfolioTotals(holdings)
    // Year to date; early in the year (too short to annualize) the whole history is used
    const annualized =
        computeAnnualizedReturn(
            transactions,
            tickerData,
            rates,
            totals.currentValue,
            getYearOpening(snapshots)
        ) ?? computeAnnualizedReturn(transactions, tickerData, rates, totals.currentValue)
    const projectionRate = resolveProjectionRate(annualized)
    const scenarios = buildScenarios({
        startValueEur: totals.currentValue,
        startInvestedEur: totals.totalInvested,
        annualRate: projectionRate.rate,
        months: PROJECTION_MONTHS,
    })
    const baseContributionEur = scenarios.at(0)?.monthlyContributionEur ?? 0
    const amounts = scenarios
        .map((scenario) => formatCurrency(scenario.monthlyContributionEur, currency, 0))
        .join(', ')

    return (
        <Card className="gap-0 py-0">
            <section
                aria-labelledby="planning-title"
                className="flex flex-col gap-4 border-b p-5 lg:p-6"
            >
                <div className="flex items-center justify-between">
                    <h2
                        id="planning-title"
                        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                    >
                        Projection
                    </h2>
                    <TrendingUp aria-hidden="true" className="size-4 text-muted-foreground" />
                </div>
                <p className="max-w-prose text-sm text-muted-foreground">
                    What the portfolio could be worth in 1 and 2 years investing {amounts} every
                    month at your current annualized return.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    {projectionRate.since ? (
                        <Badge variant="outline" className="tabular-nums">
                            {projectionRate.rate > 0 && '+'}
                            {formatPercentage(projectionRate.rate * 100)} / year since{' '}
                            {formatMonthTick(projectionRate.since)}
                        </Badge>
                    ) : (
                        <Badge variant="outline">Not enough history, 0% assumed</Badge>
                    )}
                    {projectionRate.isCapped && <Badge variant="secondary">Capped</Badge>}
                </div>
                <dl className="grid grid-cols-3 gap-4 border-t pt-4">
                    <TodayStat
                        label="Today"
                        value={totals.currentValue}
                        hidePrices={hidePrices}
                        isLarge
                    />
                    <TodayStat
                        label="Invested"
                        value={totals.totalInvested}
                        hidePrices={hidePrices}
                    />
                    <TodayStat
                        label="Unrealized"
                        value={totals.unrealizedGl}
                        hidePrices={hidePrices}
                        isSigned
                    />
                </dl>
            </section>

            <ol className="flex flex-col divide-y border-b">
                {scenarios.map((scenario) => (
                    <ScenarioRow
                        key={scenario.key}
                        scenario={scenario}
                        baseContributionEur={baseContributionEur}
                        hidePrices={hidePrices}
                    />
                ))}
            </ol>

            <section
                aria-labelledby="projection-chart-title"
                className="flex min-w-0 flex-col gap-4 p-5 lg:p-6"
            >
                <div className="flex flex-col gap-0.5">
                    <h2 id="projection-chart-title" className="text-sm font-semibold">
                        Month by month
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Projected value for each monthly amount
                    </p>
                </div>
                <ProjectionChart scenarios={scenarios} hidePrices={hidePrices} />
            </section>
        </Card>
    )
}
