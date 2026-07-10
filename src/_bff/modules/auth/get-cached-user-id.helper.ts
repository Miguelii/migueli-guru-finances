import { cache } from 'react'
import { createSbServerClient } from '@/_bff/common/supabase/supabase.client'

/**
 * Best-effort current user id for logging. Reads the `sub` claim from the
 * access token via `getClaims()`, which verifies the JWT locally (WebCrypto)
 * with asymmetric signing keys — no `getUser()` network round-trip. Wrapped in
 * React `cache()` so it runs at most once per request. Never throws — returns
 * undefined on any failure or when there is no authenticated user.
 */
export const getCachedUserId = cache(async (): Promise<string | undefined> => {
    try {
        const supabase = await createSbServerClient()
        const { data } = await supabase.auth.getClaims()
        return data?.claims?.sub ?? undefined
    } catch {
        return undefined
    }
})
