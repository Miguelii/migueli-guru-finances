export const HOME_PAGE_PATH = '/' as const

export const UPDATE_TICKERS_API_PATH = '/api/updateTickers' as const

export const SYNC_BANK_BALANCES_API_PATH = '/api/syncBankBalances' as const

export const BANK_CALLBACK_API_PATH = '/api/bank/callback' as const

export const TRPC_API_PATH = '/api/trpc' as const

export const FORCE_SIGN_OUT_API_PATH = '/api/auth/sign-out' as const

export const PRIVATE_ROUTE_PATH = '/portfolio' as const

export const TRANSACTIONS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/transactions` as const

export const POSITIONS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/positions` as const

export const PLANNING_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/planning` as const

export const ETF_PLANNING_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/etf-planning` as const

export const PAYSLIPS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/payslips` as const

export const EXPENSES_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/expenses` as const

export const EMERGENCY_FUND_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/emergency-fund` as const

export const NEWS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/news` as const

export const PRICES_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/prices` as const

export const SETTINGS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/settings` as const

export const LOGS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/logs` as const

// Dev tools (only reachable in development)
export const CACHE_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/cache` as const

export const CRYPTO_CURRENCIES = new Set(['USDC', 'USDT'])
