export const HOME_PAGE_PATH = '/' as const

export const UPDATE_TICKERS_API_PATH = '/api/updateTickers' as const

export const TRPC_API_PATH = '/api/trpc' as const

export const PRIVATE_ROUTE_PATH = '/portfolio' as const

export const PRICES_ROUTE_PATH = `${PRIVATE_ROUTE_PATH}/prices` as const

export const CRYPTO_CURRENCIES = new Set(['USDC', 'USDT'])
