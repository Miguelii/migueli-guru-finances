export const HOME_PAGE_PATH = '/' as const

export const UPDATE_TICKERS_API_PATH = '/api/updateTickers' as const

export const TRPC_API_PATH = '/api/trpc' as const

export const FORCE_SIGN_OUT_API_PATH = '/api/auth/sign-out' as const

export const PRIVATE_ROUTE_PATH = '/portfolio' as const

export const TRANSACTIONS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/transactions` as const

export const POSITIONS_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/positions` as const

export const PRICES_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/prices` as const

export const CRYPTO_CURRENCIES = new Set(['USDC', 'USDT'])
