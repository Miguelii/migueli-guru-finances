'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { LogRange } from '@/lib/constants/logs'
import { LOG_LEVELS, LOGS_CHART_CONFIG } from '@/modules/logs/logs.constants'
import { formatBucketLabel, type LogHistogramBucket } from '@/modules/logs/logs.helpers'

type Props = {
    buckets: LogHistogramBucket[]
    range: LogRange
}

export function LogsHistogram({ buckets, range }: Props) {
    return (
        <figure className="border bg-card px-2 pt-3 pb-1">
            <figcaption className="sr-only">Log volume over time, stacked by level</figcaption>
            <ChartContainer config={LOGS_CHART_CONFIG} className="aspect-auto h-28 w-full">
                <BarChart data={buckets} margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="start"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={48}
                        tickMargin={6}
                        fontSize={10}
                        tickFormatter={(value: number) => formatBucketLabel(value, range)}
                    />
                    <YAxis hide allowDecimals={false} />
                    <ChartTooltip
                        cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    const start = payload?.[0]?.payload?.start
                                    return typeof start === 'number'
                                        ? formatBucketLabel(start, range)
                                        : ''
                                }}
                            />
                        }
                    />
                    {LOG_LEVELS.toReversed().map((level) => (
                        <Bar
                            key={level}
                            name={level}
                            dataKey={(bucket: Record<string, number>) => bucket[level]}
                            stackId="levels"
                            fill={`var(--color-${level})`}
                            isAnimationActive={false}
                        />
                    ))}
                </BarChart>
            </ChartContainer>
        </figure>
    )
}
