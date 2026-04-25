'use client'

import { useMemo } from 'react'
import { Pie, PieChart, Cell, Label } from 'recharts'
import type { Props as LabelProps } from 'recharts/types/component/Label'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart'
import type { HoldingSummary } from '@/types/Holding'
import { formatCurrency, formatPercentage } from '@/lib/formaters'
import { Currency, type CambioRates } from '@/types/Transaction'
import { computePortfolioTotals } from '@/lib/calculations'
import { cn, toEur } from '@/lib/utils'

type Props = {
    holdings: HoldingSummary[]
    rates: CambioRates
    hidePrices: boolean
}

const currency = Currency.EUR

const LABEL_THRESHOLD = 5

export function AllocationChart({ holdings, rates, hidePrices }: Props) {
    const { currentValue: totalValue } = computePortfolioTotals(holdings, rates)

    const data = useMemo(
        () =>
            holdings.map((h) => {
                const valueInEur = toEur(h.total_invested, h.currency, rates)
                return {
                    name: h.symbol,
                    value: valueInEur,
                    percentage: totalValue > 0 ? (valueInEur / totalValue) * 100 : 0,
                    currency: Currency.EUR,
                    fill: h?.tickerHexColor ?? '#fffff',
                }
            }),
        [holdings, rates, totalValue]
    )

    const chartConfig = useMemo(
        () =>
            Object.fromEntries(
                holdings.map((h) => [
                    h.symbol,
                    {
                        label: h.symbol,
                        color: h.tickerHexColor,
                    },
                ])
            ) satisfies ChartConfig,
        [holdings]
    )

    return (
        <div className="flex flex-col gap-2 h-full w-full">
            <ChartContainer config={chartConfig} className="aspect-square h-full max-h-75 w-full">
                <PieChart>
                    <ChartTooltip
                        content={<ChartTooltipContent formatter={tooltipFormatter} hideLabel />}
                    />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="75%"
                        strokeWidth={2}
                        stroke="var(--color-background)"
                        label={renderCustomLabel}
                        labelLine={false}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                        ))}
                        <Label content={renderCenterLabel(totalValue, hidePrices)} />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 justify-center items-center">
                {data
                    .filter((d) => d.percentage < LABEL_THRESHOLD)
                    .map((d) => (
                        <span
                            key={d.name}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                            <span
                                className="inline-block h-2 w-2 rounded-sm"
                                style={{ background: d.fill }}
                            />
                            {d.name} {d.percentage.toFixed(1)}%
                        </span>
                    ))}
            </div>
        </div>
    )
}

function renderCustomLabel({
    cx,
    cy,
    midAngle,
    outerRadius,
    name,
    percentage,
}: {
    cx: number
    cy: number
    midAngle: number
    outerRadius: number
    name: string
    percentage: number
}) {
    if (percentage < LABEL_THRESHOLD) return null

    const RADIAN = Math.PI / 180
    const radius = outerRadius + 24
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
        <text
            x={x}
            y={y}
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            className="fill-foreground text-xs"
        >
            <tspan className="font-semibold">{name}</tspan>
            <tspan className="fill-muted-foreground"> {percentage.toFixed(1)}%</tspan>
        </text>
    )
}

function renderCenterLabel(totalValue: number, hidePrices: boolean) {
    return function CenterLabel({ viewBox }: LabelProps) {
        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
            return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 8}
                        className="fill-muted-foreground text-xs"
                    >
                        Total Net Worth
                    </tspan>
                    <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 10}
                        className={cn('fill-foreground text-sm font-semibold', {
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
    _value: number | string | Array<number | string>,
    name: number | string,
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
