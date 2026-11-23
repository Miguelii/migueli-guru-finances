import type { ChartConfig } from '@/components/ui/chart'

export const VALUE_CHART_CONFIG = {
    valueEur: { label: 'Value', color: 'var(--color-brand)' },
    investedEur: { label: 'Invested', color: 'var(--color-muted-foreground)' },
    gainEur: { label: 'Gain', color: 'var(--color-success)' },
} satisfies ChartConfig

export type ValueChartKey = keyof typeof VALUE_CHART_CONFIG

// Legend entries in display order, with the line style each series is drawn with
export const VALUE_CHART_LEGEND = [
    { key: 'valueEur', swatchClassName: 'bg-brand h-0.5 w-3.5' },
    { key: 'investedEur', swatchClassName: 'bg-muted-foreground h-0.5 w-3.5' },
    { key: 'gainEur', swatchClassName: 'h-0 w-3.5 border-t-2 border-dashed border-success' },
] as const satisfies ReadonlyArray<{ key: ValueChartKey; swatchClassName: string }>

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
