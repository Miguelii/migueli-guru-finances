export const PROJECTION_MONTHS = 24

// Monthly amounts compared side by side (EUR), the first one is the base the others are
// compared against. Colors go from light to dark as the amount grows, and each line
// also has its own dash pattern so the chart does not rely on color alone
export const SCENARIOS = [
    {
        monthlyContributionEur: 1000,
        color: 'var(--color-chart-1)',
        swatchClassName: 'bg-chart-1',
        strokeDasharray: '3 3',
    },
    {
        monthlyContributionEur: 1250,
        color: 'var(--color-chart-2)',
        swatchClassName: 'bg-chart-2',
        strokeDasharray: '8 4',
    },
    {
        monthlyContributionEur: 1500,
        color: 'var(--color-chart-4)',
        swatchClassName: 'bg-chart-4',
        strokeDasharray: '12 4',
    },
    {
        monthlyContributionEur: 1800,
        color: 'var(--color-chart-5)',
        swatchClassName: 'bg-chart-5',
        strokeDasharray: undefined,
    },
] as const

export const MILESTONES = [
    { offset: 0, label: 'Today', shortLabel: 'Now' },
    { offset: 12, label: 'In 1 year', shortLabel: '+1y' },
    { offset: 24, label: 'In 2 years', shortLabel: '+2y' },
] as const

// Fixed yearly return assumed by the projection (`0.08` = 8%), not the portfolio's own history
export const PROJECTION_ANNUAL_RATE = 0.08
