export const HOUSE_PRICES_EUR = [180_000, 200_000, 250_000, 300_000] as const

export const DOWN_PAYMENT_RATIOS = [0.1, 0.15] as const

// Banks finance at most 90% of a primary home, so no plan can go below this down payment
export const MIN_DOWN_PAYMENT_RATIO = 0.1

export const HEALTHY_PAYMENT_EUR = { min: 500, max: 600 } as const

// Above the healthy limit but still close to it, anything higher is shown as heavy
export const STRETCH_PAYMENT_EUR = 750

export const DEFAULT_MONTHLY_SAVING_EUR = 1700

// 12-month Euribor (about 3.25% in late 2026) plus a typical spread
export const DEFAULT_ANNUAL_RATE_PCT = 4

export const DEFAULT_TERM_YEARS = 40

export const AFFORDABILITY_LATER_MONTHS = 24

export const HEALTHY_STAR_KEY = 'healthy'

export const PAYMENT_BAR_CLASS_NAMES = {
    healthy: 'bg-success',
    stretch: 'bg-warning',
    heavy: 'bg-destructive',
} as const

export const HOUSE_STATUSES = {
    locked: { label: 'Not reachable yet', badgeClassName: 'bg-muted text-muted-foreground' },
    reachable: {
        label: 'Reachable, payment too high',
        badgeClassName: 'bg-warning text-background',
    },
    fits: { label: 'Fits your budget', badgeClassName: 'bg-success text-background' },
} as const
