'use client'

import { useMemo } from 'react'
import { DonutChart, type DonutChartItem } from '@/components/ui/donut-chart'
import type { HoldingSummary } from '@/types/Holding'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
    chartLabel: string
}

export function AllocationChart({ holdings, hidePrices, chartLabel }: Props) {
    const data = useMemo(() => {
        const totalInvested = holdings.reduce((sum, h) => sum + h.total_invested_eur, 0)

        return holdings.map(
            (h): DonutChartItem => ({
                name: h.symbol,
                value: h.total_invested_eur,
                percentage: totalInvested > 0 ? (h.total_invested_eur / totalInvested) * 100 : 0,
                fill: h?.tickerHexColor ?? '#fffff',
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
