'use client'

import { useId } from 'react'
import { Area, AreaChart, YAxis } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

type Props = {
    values: number[]
    color: string
}

export function KpiSparkline({ values, color }: Props) {
    const gradientId = `kpi-fill-${useId().replaceAll(':', '')}`

    if (values.length < 2) return null

    const data = values.map((value, index) => ({ index, value }))

    return (
        <div aria-hidden="true" className="h-11 w-24 shrink-0 self-end">
            <ChartContainer config={{ value: { color } }} className="aspect-auto size-full">
                <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Area
                        dataKey="value"
                        type="monotone"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    )
}
