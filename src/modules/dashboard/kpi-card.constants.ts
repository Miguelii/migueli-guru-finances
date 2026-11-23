export type KpiAccent = 'brand' | 'success' | 'destructive'

// Stroke of the sparkline per accent (recharts props, not class names)
export const KPI_ACCENT_COLOR: Record<KpiAccent, string> = {
    brand: 'var(--color-brand)',
    success: 'var(--color-success)',
    destructive: 'var(--color-destructive)',
}

// Months shown in each KPI sparkline
export const KPI_SPARKLINE_POINTS = 12
