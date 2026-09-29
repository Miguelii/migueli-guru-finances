'use client'

import { useReducedMotion } from 'motion/react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/portfolio/formaters'
import type { InvestedTimelinePoint } from '@/lib/portfolio/invested-timeline'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/Transaction'
import {
    INVESTED_CHART_CONFIG,
    INVESTED_CHART_GRADIENT_ID,
} from '@/modules/net-worth-hero/net-worth-hero.constants'
import {
    formatCompactEur,
    formatMonthLong,
    formatMonthTick,
    getInvestedChartSummary,
} from '@/modules/net-worth-hero/net-worth-hero.helpers'

type Props = {
    points: InvestedTimelinePoint[]
    currentValue: number
    hidePrices: boolean
}

export function InvestedTimelineChart({ points, currentValue, hidePrices }: Props) {
    const shouldReduceMotion = useReducedMotion()

    if (points.length === 0) {
        return (
            <div className="grid h-56 place-items-center border border-dashed text-xs text-muted-foreground">
                Add your first transaction to see your invested capital over time
            </div>
        )
    }

    return (
        <figure
            role="img"
            aria-label={getInvestedChartSummary(points, currentValue, hidePrices)}
            className="h-56 w-full min-w-0 lg:h-full lg:min-h-56"
        >
            <ChartContainer config={INVESTED_CHART_CONFIG} className="aspect-auto size-full">
                <AreaChart data={points} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={INVESTED_CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor="var(--color-investedEur)"
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="100%"
                                stopColor="var(--color-investedEur)"
                                stopOpacity={0.02}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
                    <XAxis
                        dataKey="month"
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
                        domain={[0, (dataMax: number) => Math.max(dataMax, currentValue) * 1.1]}
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
                    <ReferenceLine
                        y={currentValue}
                        stroke="var(--color-foreground)"
                        strokeDasharray="4 4"
                        strokeOpacity={0.6}
                        label={{
                            value: 'Current value',
                            position: 'insideTopLeft',
                            className: 'fill-muted-foreground text-xs',
                        }}
                    />
                    <Area
                        dataKey="investedEur"
                        type="stepAfter"
                        stroke="var(--color-investedEur)"
                        strokeWidth={2}
                        fill={`url(#${INVESTED_CHART_GRADIENT_ID})`}
                        isAnimationActive={!shouldReduceMotion}
                    />
                </AreaChart>
            </ChartContainer>
        </figure>
    )
}

function renderTooltipValue(hidePrices: boolean) {
    return function TooltipValue(value: unknown) {
        return (
            <div className="flex w-full items-center justify-between gap-4">
                <span className="text-muted-foreground">Invested</span>
                <span
                    className={cn('font-medium tabular-nums', {
                        'blur-sm select-none': hidePrices,
                    })}
                >
                    {formatCurrency(Number(value), Currency.EUR)}
                </span>
            </div>
        )
    }
}
