'use client'

import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { getDeltaTone } from '@/components/ui/delta-badge.helpers'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    formatCompactEur,
    formatCurrency,
    formatMonthLong,
    formatMonthTick,
} from '@/lib/portfolio/formaters'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import { cn } from '@/lib/utils'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'
import { RebuildSnapshotsButton } from '@/modules/dashboard/rebuild-snapshots-button'
import {
    VALUE_CHART_CONFIG,
    VALUE_CHART_GRADIENT_ID,
    VALUE_CHART_LEGEND,
    VALUE_RANGE_LABEL,
    VALUE_RANGES,
    ValueRange,
} from '@/modules/dashboard/performance-chart.constants'
import {
    filterPointsByRange,
    getValueChartSummary,
    isValueRange,
    toPerformancePoints,
} from '@/modules/dashboard/performance-chart.helpers'
import { Currency } from '@/types/core/Currency'

type Props = {
    points: PortfolioSnapshotPoint[]
    hidePrices: boolean
    /** Shows the history rebuild action (development only) */
    isDev: boolean
}

type TooltipValue = number | string | ReadonlyArray<number | string> | undefined
type TooltipName = number | string | undefined

const currency = Currency.EUR

function getValueChartLabel(key: string) {
    switch (key) {
        case 'valueEur':
            return VALUE_CHART_CONFIG.valueEur.label
        case 'investedEur':
            return VALUE_CHART_CONFIG.investedEur.label
        case 'gainEur':
            return VALUE_CHART_CONFIG.gainEur.label
    }
}

export function PerformanceChart({ points, hidePrices, isDev }: Props) {
    const shouldReduceMotion = useReducedMotion()
    const [range, setRange] = useState<ValueRange>(ValueRange.Year)

    const visiblePoints = filterPointsByRange(toPerformancePoints(points), range)
    const hasHistory = points.length >= 2
    const latestGain = visiblePoints.at(-1)?.gainEur ?? 0
    const gainTone = getDeltaTone(latestGain)
    const hasLosses = visiblePoints.some((point) => point.gainEur < 0)

    return (
        <>
            <DashboardCardHeader
                id="performance-title"
                title="Performance"
                subtitle="Unrealized gain"
                actions={
                    <>
                        {isDev && <RebuildSnapshotsButton />}
                        <ul
                            aria-label="Chart legend"
                            className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex"
                        >
                            {VALUE_CHART_LEGEND.map((entry) => (
                                <li key={entry.key} className="flex items-center gap-1.5">
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'shrink-0 rounded-full',
                                            entry.swatchClassName
                                        )}
                                    />
                                    {VALUE_CHART_CONFIG[entry.key].label}
                                </li>
                            ))}
                        </ul>
                        {hasHistory && (
                            <Tabs
                                value={range}
                                onValueChange={(value) => {
                                    if (isValueRange(value)) setRange(value)
                                }}
                            >
                                <TabsList className="h-8">
                                    {VALUE_RANGES.map((option) => (
                                        <TabsTrigger
                                            key={option}
                                            value={option}
                                            className="cursor-pointer border-transparent px-2.5 text-xs"
                                        >
                                            {VALUE_RANGE_LABEL[option]}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        )}
                    </>
                }
            />

            <p
                className={cn('-mt-2 text-2xl font-semibold tracking-tight tabular-nums', {
                    'text-success': gainTone === 'positive',
                    'text-destructive': gainTone === 'negative',
                    'blur-md select-none': hidePrices,
                })}
            >
                {latestGain > 0 ? '+' : ''}
                {formatCurrency(latestGain, currency)}
            </p>

            {hasHistory ? (
                <figure
                    role="img"
                    aria-label={getValueChartSummary(visiblePoints, hidePrices)}
                    className="h-64 w-full min-w-0 lg:h-full lg:min-h-64"
                >
                    <ChartContainer config={VALUE_CHART_CONFIG} className="aspect-auto size-full">
                        <ComposedChart
                            data={visiblePoints}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id={VALUE_CHART_GRADIENT_ID}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--color-valueEur)"
                                        stopOpacity={0.18}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--color-valueEur)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeOpacity={0.6} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={formatMonthTick}
                            />
                            <YAxis
                                hide={hidePrices}
                                width={56}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCompactEur}
                                domain={[
                                    (dataMin: number) => Math.min(0, dataMin * 1.1),
                                    (dataMax: number) => dataMax * 1.1,
                                ]}
                            />
                            {hasLosses && <ReferenceLine y={0} stroke="var(--color-border)" />}
                            <ChartTooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={
                                    <ChartTooltipContent
                                        indicator="line"
                                        labelFormatter={(label) => formatMonthLong(String(label))}
                                        formatter={renderTooltipValue(hidePrices)}
                                    />
                                }
                            />
                            <Area
                                dataKey="valueEur"
                                type="monotone"
                                stroke="var(--color-valueEur)"
                                strokeWidth={2}
                                fill={`url(#${VALUE_CHART_GRADIENT_ID})`}
                                isAnimationActive={!shouldReduceMotion}
                            />
                            <Line
                                dataKey="investedEur"
                                type="stepAfter"
                                stroke="var(--color-investedEur)"
                                strokeWidth={1.5}
                                dot={false}
                                isAnimationActive={!shouldReduceMotion}
                            />
                            <Line
                                dataKey="gainEur"
                                type="monotone"
                                stroke="var(--color-gainEur)"
                                strokeWidth={2}
                                strokeDasharray="5 4"
                                dot={false}
                                isAnimationActive={!shouldReduceMotion}
                            />
                        </ComposedChart>
                    </ChartContainer>
                </figure>
            ) : (
                <div className="grid h-64 place-items-center rounded-lg border border-dashed px-4 text-center text-xs text-muted-foreground">
                    A snapshot is saved every day and the chart fills in month by month.
                    {isDev && ' Rebuild the history to fill it back to your first transaction.'}
                </div>
            )}
        </>
    )
}

function renderTooltipValue(hidePrices: boolean) {
    return function TooltipValue(value: TooltipValue, name: TooltipName) {
        const key = String(name)
        const amount = Number(value)
        const tone = getDeltaTone(amount)
        const isGain = key === 'gainEur'

        return (
            <div className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                        aria-hidden="true"
                        className="h-2.5 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: `var(--color-${key})` }}
                    />
                    {getValueChartLabel(key)}
                </span>
                <span
                    className={cn('font-medium tabular-nums', {
                        'text-success': isGain && tone === 'positive',
                        'text-destructive': isGain && tone === 'negative',
                        'blur-sm select-none': hidePrices,
                    })}
                >
                    {isGain && amount > 0 ? '+' : ''}
                    {formatCurrency(amount, currency)}
                </span>
            </div>
        )
    }
}
