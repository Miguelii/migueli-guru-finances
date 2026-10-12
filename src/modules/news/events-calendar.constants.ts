import { PortfolioEventType } from '@/types/News'

export const EVENT_TYPE_LABEL: Record<PortfolioEventType, string> = {
    [PortfolioEventType.Earnings]: 'Earnings',
    [PortfolioEventType.ExDividend]: 'Ex-dividend',
    [PortfolioEventType.DividendPayment]: 'Dividend payment',
}

// Dots on the month grid, explained by the legend (the type is also written in the lists)
export const EVENT_TYPE_DOT_CLASS: Record<PortfolioEventType, string> = {
    [PortfolioEventType.Earnings]: 'bg-chart-2',
    [PortfolioEventType.ExDividend]: 'bg-warning',
    [PortfolioEventType.DividendPayment]: 'bg-success',
}

export const EVENT_TYPE_BADGE_VARIANT = {
    [PortfolioEventType.Earnings]: 'default',
    [PortfolioEventType.ExDividend]: 'alert',
    [PortfolioEventType.DividendPayment]: 'success',
} as const

export const EVENT_TYPES = Object.values(PortfolioEventType)

// Monday first, like the Portuguese calendar
export const WEEKDAY_LABELS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] as const

export const UPCOMING_EVENTS_LIMIT = 5

// Dots drawn per day before the cell runs out of room
export const MAX_DOTS_PER_DAY = 3
