import { ASSETS_ROUTER } from '@/_bff/modules/assets/assets.router'
import { AUTH_ROUTER } from '@/_bff/modules/auth/auth.router'
import { TRANSACTIONS_ROUTER } from '@/_bff/modules/transactions/transactions.router'
import { router } from '@/_trpc/server'

export const appRouter = router({
    auth: AUTH_ROUTER,
    assets: ASSETS_ROUTER,
    transactions: TRANSACTIONS_ROUTER,
})

export type AppRouter = typeof appRouter
