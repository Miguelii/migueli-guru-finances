'use client'

import { useReducedMotion } from 'motion/react'
import { CartesianGrid, LineChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
    formatCompactEur,
    formatCurrency,
    formatMonthLong,
    formatMonthTick,
} from '@/lib/portfolio/formaters'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/Transaction'
import type { Scenario } from '@/modules/planning/planning-card.helpers'
import {
    getProjectionChartSummary,
    getScenarioChartConfig,
    toScenarioChartRows,
} from '@/modules/planning/projection-chart.helpers'

type Props = {
    scenarios: Scenario[]
    hidePrices: boolean
}

const currency = Currency.EUR

export function ProjectionChart({ scenarios, hidePrices }: Props) {
    const shouldReduceMotion = useReducedMotion()
    const config = getScenarioChartConfig(scenarios)
    const rows = toScenarioChartRows(scenarios)
    const futureMilestones = (scenarios.at(0)?.milestones ?? []).filter(
        (milestone) => milestone.offset > 0
    )

    return (
        <figure
            role="img"
            aria-label={getProjectionChartSummary(scenarios, hidePrices)}
            className="h-64 w-full min-w-0 md:h-72"
        >
            <ChartContainer config={config} className="aspect-auto size-full">
                <LineChart data={rows} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
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
                        domain={[0, (dataMax: number) => dataMax * 1.1]}
                    />
                    <ChartTooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={
                            <ChartTooltipContent
                                indicator="line"
                                labelFormatter={(label) => formatMonthLong(String(label))}
                                formatter={renderTooltipValue(config, hidePrices)}
                            />
                        }
                    />
                    {futureMilestones.map((milestone) => (
                        <ReferenceLine
                            key={milestone.offset}
                            x={milestone.month}
                            stroke="var(--color-border)"
                            strokeDasharray="4 4"
                            label={{
                                value: milestone.shortLabel,
                                position: 'insideTopRight',
                                fill: 'var(--color-muted-foreground)',
                                fontSize: 11,
                            }}
                        />
                    ))}
                    {scenarios.map((scenario) => (
                        <Line
                            key={scenario.key}
                            dataKey={scenario.key}
                            type="monotone"
                            stroke={`var(--color-${scenario.key})`}
                            strokeWidth={2}
                            strokeDasharray={scenario.strokeDasharray}
                            dot={false}
                            isAnimationActive={!shouldReduceMotion}
                        />
                    ))}
                </LineChart>
            </ChartContainer>
        </figure>
    )
}

function renderTooltipValue(
    config: ReturnType<typeof getScenarioChartConfig>,
    hidePrices: boolean
) {
    return function TooltipValue(value: unknown, name: unknown) {
        const key = String(name)

        return (
            <div className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                        aria-hidden="true"
                        className="h-2.5 w-1 shrink-0"
                        style={{ backgroundColor: `var(--color-${key})` }}
                    />
                    {config[key]?.label}
                </span>
                <span
                    className={cn('font-medium tabular-nums', {
                        'blur-sm select-none': hidePrices,
                    })}
                >
                    {formatCurrency(Number(value), currency, 0)}
                </span>
            </div>
        )
    }
}
