import { cache } from 'react'
import { createDBServerClient } from '@/_bff/common/db/db.utils'

/**
 * Best-effort current user id for logging. Reads the `sub` claim from the
 * access token via `getClaims()`, which verifies the JWT locally (WebCrypto)
 * with asymmetric signing keys — no `getUser()` network round-trip. Wrapped in
 * React `cache()` so it runs at most once per request. Never throws — returns
 * undefined on any failure or when there is no authenticated user.
 */
export const getCachedUserId = cache(async (): Promise<string | undefined> => {
    try {
        const bd = await createDBServerClient()
        const { data } = await bd.auth.getClaims()
        return data?.claims?.sub ?? undefined
    } catch {
        return undefined
    }
})
