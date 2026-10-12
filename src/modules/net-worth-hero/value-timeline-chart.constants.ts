import type { ChartConfig } from '@/components/ui/chart'

export const VALUE_CHART_CONFIG = {
    valueEur: { label: 'Value', color: 'var(--color-success)' },
    investedEur: { label: 'Invested', color: 'var(--color-chart-2)' },
} satisfies ChartConfig

export const VALUE_CHART_GRADIENT_ID = 'portfolio-value-fill'

export const ValueRange = {
    Quarter: '3M',
    YearToDate: 'YTD',
    Year: '1Y',
    All: 'ALL',
} as const

export type ValueRange = (typeof ValueRange)[keyof typeof ValueRange]

export const VALUE_RANGES = Object.values(ValueRange)

export const VALUE_RANGE_LABEL: Record<ValueRange, string> = {
    [ValueRange.Quarter]: '3M',
    [ValueRange.YearToDate]: 'YTD',
    [ValueRange.Year]: '1Y',
    [ValueRange.All]: 'All',
}

// Months each fixed range looks back from the latest snapshot
export const VALUE_RANGE_MONTHS: Partial<Record<ValueRange, number>> = {
    [ValueRange.Quarter]: 3,
    [ValueRange.Year]: 12,
}
