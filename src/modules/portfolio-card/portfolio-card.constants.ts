export const PORTFOLIO_CARD_DISCLOSURE_COOKIE = 'portfolio_card_state'
export const PORTFOLIO_CARD_DISCLOSURE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const PORTFOLIO_CARD_IDS = [
    'emergency-fund',
    'staking',
    'etf-planning',
    'transactions',
    'monthly-purchases',
    'holdings',
    'closed-positions',
    'news',
    'events-calendar',
] as const

export type PortfolioCardId = (typeof PORTFOLIO_CARD_IDS)[number]

export const DEFAULT_PORTFOLIO_CARD_STATE: Record<PortfolioCardId, boolean> = {
    'emergency-fund': false,
    staking: true,
    'etf-planning': true,
    transactions: true,
    'monthly-purchases': true,
    holdings: true,
    'closed-positions': false,
    news: true,
    'events-calendar': true,
}
