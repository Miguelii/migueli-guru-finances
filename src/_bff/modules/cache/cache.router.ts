import 'server-only'

import { router } from '@/_bff/trpc/server'
import { REVALIDATE_CACHE_PROTECTED_CONTROLLER } from '@/_bff/modules/cache/revalidate-cache/revalidate-cache.controller'

export const CACHE_ROUTER = router({
    revalidate: REVALIDATE_CACHE_PROTECTED_CONTROLLER,
})
