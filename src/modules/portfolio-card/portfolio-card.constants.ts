export const PORTFOLIO_CARD_DISCLOSURE_COOKIE = 'portfolio_card_state'
export const PORTFOLIO_CARD_DISCLOSURE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const PORTFOLIO_CARD_IDS = [
    'allocation',
    'allocation-by-type',
    'transactions',
    'monthly-purchases',
    'holdings',
] as const

export type PortfolioCardId = (typeof PORTFOLIO_CARD_IDS)[number]

export const DEFAULT_PORTFOLIO_CARD_STATE: Record<PortfolioCardId, boolean> = {
    allocation: true,
    'allocation-by-type': true,
    transactions: true,
    'monthly-purchases': true,
    holdings: true,
}
