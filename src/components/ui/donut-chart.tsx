'use client'

import { useMemo } from 'react'
import { useReducedMotion } from 'motion/react'
import { Pie, PieChart, Cell, Label } from 'recharts'
import type { Props as LabelProps } from 'recharts/types/component/Label'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency, formatPercentage } from '@/lib/portfolio/formaters'
import { Currency } from '@/types/Transaction'
import { cn } from '@/lib/utils'

export type DonutChartItem = {
    name: string
    value: number
    percentage: number
    fill: string
}

type Props = {
    data: DonutChartItem[]
    totalValue: number
    hidePrices: boolean
    chartLabel: string
}

const currency = Currency.EUR

export function DonutChart({ data, totalValue, hidePrices, chartLabel }: Props) {
    const shouldReduceMotion = useReducedMotion()
    const chartConfig = useMemo(
        () =>
            Object.fromEntries(
                data.map((d) => [d.name, { label: d.name, color: d.fill }])
            ) satisfies ChartConfig,
        [data]
    )
    const maxPercentage = Math.max(...data.map((d) => d.percentage), 0)

    if (data.length === 0) {
        return (
            <div className="grid h-60 place-items-center border border-dashed text-xs text-muted-foreground">
                No open positions yet
            </div>
        )
    }

    return (
        <div className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-65">
                <PieChart>
                    <ChartTooltip
                        content={<ChartTooltipContent formatter={tooltipFormatter} hideLabel />}
                    />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="68%"
                        outerRadius="100%"
                        paddingAngle={data.length > 1 ? 1.5 : 0}
                        strokeWidth={0}
                        isAnimationActive={!shouldReduceMotion}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                        ))}
                        <Label content={renderCenterLabel(totalValue, hidePrices, chartLabel)} />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <ol className="flex flex-col gap-3" aria-label={`${chartLabel} allocation`}>
                {data.map((d) => (
                    <li key={d.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="flex min-w-0 items-center gap-2">
                                <span
                                    aria-hidden="true"
                                    className="size-2.5 shrink-0"
                                    style={{ background: d.fill }}
                                />
                                <span className="truncate font-medium">{d.name}</span>
                            </span>
                            <span className="flex items-baseline gap-2 tabular-nums">
                                <span
                                    className={cn('text-muted-foreground', {
                                        'blur-sm select-none': hidePrices,
                                    })}
                                >
                                    {formatCurrency(d.value, currency, 0)}
                                </span>
                                <span className="w-12 text-right font-semibold">
                                    {d.percentage.toFixed(1)}%
                                </span>
                            </span>
                        </div>
                        <div className="h-1 w-full bg-muted" aria-hidden="true">
                            <div
                                className="h-full"
                                style={{
                                    width: `${maxPercentage > 0 ? (d.percentage / maxPercentage) * 100 : 0}%`,
                                    background: d.fill,
                                }}
                            />
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    )
}

function renderCenterLabel(totalValue: number, hidePrices: boolean, label: string) {
    return function CenterLabel({ viewBox }: LabelProps) {
        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
            return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 8}
                        className="fill-muted-foreground text-xs"
                    >
                        {label}
                    </tspan>
                    <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 10}
                        className={cn('fill-foreground text-base font-semibold', {
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {formatCurrency(totalValue, currency)}
                    </tspan>
                </text>
            )
        }
        return null
    }
}

function tooltipFormatter(
    _value: number | string | ReadonlyArray<number | string> | undefined,
    name: number | string | undefined,
    item: { payload?: { percentage: number } }
) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{name}</span>
            <span className="font-mono font-medium tabular-nums">
                {formatPercentage(item.payload?.percentage ?? 0).replace('+', '')}
            </span>
        </div>
    )
}
