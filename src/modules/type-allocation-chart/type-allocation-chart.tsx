'use client'

import { useMemo } from 'react'
import { DonutChart, type DonutChartItem } from '@/components/ui/donut-chart'
import type { HoldingSummary } from '@/types/Holding'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
    chartLabel: string
}

const TYPE_COLORS: Record<string, string> = {
    CRYPTO: '#F7931A',
    ETF: '#22c55e',
    STOCK: '#3b82f6',
    CAMBIO: '#8b5cf6',
}

export function TypeAllocationChart({ holdings, hidePrices, chartLabel }: Props) {
    const data = useMemo(() => {
        const grouped = new Map<string, number>()
        for (const h of holdings) {
            const type = h.tickerType
            grouped.set(type, (grouped.get(type) ?? 0) + h.current_value_eur)
        }
        const total = Array.from(grouped.values()).reduce((sum, v) => sum + v, 0)
        return Array.from(grouped.entries()).map(
            ([type, value]): DonutChartItem => ({
                name: type,
                value,
                percentage: total > 0 ? (value / total) * 100 : 0,
                fill: TYPE_COLORS[type] ?? '#888888',
            })
        )
    }, [holdings])

    const totalValue = data.reduce((sum, d) => sum + d.value, 0)

    return (
        <DonutChart
            data={data}
            totalValue={totalValue}
            hidePrices={hidePrices}
            chartLabel={chartLabel}
        />
    )
}
