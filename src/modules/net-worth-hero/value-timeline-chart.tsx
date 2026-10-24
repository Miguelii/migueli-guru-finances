'use client'

import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
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
import { RebuildSnapshotsButton } from '@/modules/net-worth-hero/rebuild-snapshots-button'
import {
    VALUE_CHART_CONFIG,
    VALUE_CHART_GRADIENT_ID,
    VALUE_RANGE_LABEL,
    VALUE_RANGES,
    ValueRange,
} from '@/modules/net-worth-hero/value-timeline-chart.constants'
import {
    filterPointsByRange,
    getValueChartSummary,
} from '@/modules/net-worth-hero/value-timeline-chart.helpers'
import { Currency } from '@/types/core/Currency'

type Props = {
    points: PortfolioSnapshotPoint[]
    hidePrices: boolean
    /** Shows the history rebuild action (development only) */
    isDev: boolean
}

const currency = Currency.EUR

export function ValueTimelineChart({ points, hidePrices, isDev }: Props) {
    const shouldReduceMotion = useReducedMotion()
    const [range, setRange] = useState<ValueRange>(ValueRange.All)

    const visiblePoints = filterPointsByRange(points, range)
    const hasHistory = points.length >= 2

    return (
        <>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <h2 id="value-timeline-title" className="text-sm font-semibold">
                        Value vs invested
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Market value at the end of each month against the cost basis of open
                        positions
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isDev && <RebuildSnapshotsButton />}
                    {hasHistory && (
                        <Tabs
                            value={range}
                            onValueChange={(value) => setRange(value as ValueRange)}
                        >
                            <TabsList className="rounded-none">
                                {VALUE_RANGES.map((option) => (
                                    <TabsTrigger
                                        key={option}
                                        value={option}
                                        className="cursor-pointer rounded-none px-2 text-xs"
                                    >
                                        {VALUE_RANGE_LABEL[option]}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    )}
                </div>
            </div>

            {hasHistory ? (
                <figure
                    role="img"
                    aria-label={getValueChartSummary(visiblePoints, hidePrices)}
                    className="h-64 w-full min-w-0"
                >
                    <ChartContainer config={VALUE_CHART_CONFIG} className="aspect-auto size-full">
                        <ComposedChart
                            data={visiblePoints}
                            margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
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
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--color-valueEur)"
                                        stopOpacity={0.02}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                strokeOpacity={0.5}
                            />
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
                                width={64}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatCompactEur}
                                domain={[0, (dataMax: number) => dataMax * 1.1]}
                            />
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
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                dot={false}
                                isAnimationActive={!shouldReduceMotion}
                            />
                        </ComposedChart>
                    </ChartContainer>
                </figure>
            ) : (
                <div className="grid h-64 place-items-center border border-dashed px-4 text-center text-xs text-muted-foreground">
                    A snapshot is saved every day and the chart fills in month by month.
                    {isDev && ' Rebuild the history to fill it back to your first transaction.'}
                </div>
            )}
        </>
    )
}

function renderTooltipValue(hidePrices: boolean) {
    return function TooltipValue(
        value: unknown,
        name: unknown,
        _item: unknown,
        index: number,
        point: unknown
    ) {
        const key = String(name) as keyof typeof VALUE_CHART_CONFIG
        const snapshot = point as PortfolioSnapshotPoint
        const gain = snapshot.valueEur - snapshot.investedEur
        const tone = getDeltaTone(gain)

        return (
            <div className="flex w-full flex-col gap-1.5">
                <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span
                            aria-hidden="true"
                            className="h-2.5 w-1 shrink-0"
                            style={{ backgroundColor: `var(--color-${key})` }}
                        />
                        {VALUE_CHART_CONFIG[key]?.label}
                    </span>
                    <span
                        className={cn('font-medium tabular-nums', {
                            'blur-sm select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(Number(value), currency)}
                    </span>
                </div>
                {index === 1 && (
                    <div className="flex w-full items-center justify-between gap-4 border-t pt-1.5">
                        <span className="text-muted-foreground">Unrealized</span>
                        <span
                            className={cn('font-medium tabular-nums', {
                                'text-success': tone === 'positive',
                                'text-destructive': tone === 'negative',
                                'blur-sm select-none': hidePrices,
                            })}
                        >
                            {gain > 0 ? '+' : ''}
                            {formatCurrency(gain, currency)}
                        </span>
                    </div>
                )}
            </div>
        )
    }
}
