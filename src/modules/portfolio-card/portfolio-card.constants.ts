export const PORTFOLIO_CARD_DISCLOSURE_COOKIE = 'portfolio_card_state'
export const PORTFOLIO_CARD_DISCLOSURE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const PORTFOLIO_CARD_IDS = [
    'emergency-fund',
    'net-worth-goal',
    'allocation',
    'top-performers',
    'staking',
    'transactions',
    'monthly-purchases',
    'holdings',
    'closed-positions',
] as const

export type PortfolioCardId = (typeof PORTFOLIO_CARD_IDS)[number]

export const DEFAULT_PORTFOLIO_CARD_STATE: Record<PortfolioCardId, boolean> = {
    'emergency-fund': false,
    'net-worth-goal': false,
    allocation: true,
    'top-performers': true,
    staking: true,
    transactions: true,
    'monthly-purchases': true,
    holdings: true,
    'closed-positions': false,
}
