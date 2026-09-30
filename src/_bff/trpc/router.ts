import { ASSETS_ROUTER } from '@/_bff/modules/assets/assets.router'
import { AUTH_ROUTER } from '@/_bff/modules/auth/auth.router'
import { BANK_ROUTER } from '@/_bff/modules/bank/bank.router'
import { CACHE_ROUTER } from '@/_bff/modules/cache/cache.router'
import { LOGS_ROUTER } from '@/_bff/modules/logs/logs.router'
import { TRANSACTIONS_ROUTER } from '@/_bff/modules/transactions/transactions.router'
import { router } from '@/_bff/trpc/server'

export const appRouter = router({
    auth: AUTH_ROUTER,
    assets: ASSETS_ROUTER,
    transactions: TRANSACTIONS_ROUTER,
    bank: BANK_ROUTER,
    logs: LOGS_ROUTER,
    cache: CACHE_ROUTER,
})

export type AppRouter = typeof appRouter
