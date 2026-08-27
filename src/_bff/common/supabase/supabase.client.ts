import 'server-only'

import { createServerClient } from '@supabase/ssr'
import type { GetAllCookies, SetAllCookies } from '@supabase/ssr/dist/main/types'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'
import { ServerEnv } from '@/env/server'
import { timingSafeEqual } from 'node:crypto'

/**
 * Creates a Supabase server client with cookie-based session management.
 *
 * Always create a new client per request (required for Fluid compute).
 * @param useSecretKey - When `true`, uses the service role key to bypass RLS (server-to-server only).
 *   The returned client is session-less (no cookies) — with the ssr client a logged-in user's JWT
 *   would override the service role on every request and RLS would still apply.
 * @param hooks - Optional callbacks that run after the default cookie handlers.
 * @param hooks.onGetAll - Runs after reading all cookies from the cookie store.
 * @param hooks.onSetAll - Runs after writing cookies to the cookie store, receives the cookies that were set.
 */
export async function createSbServerClient(
    useSecretKey?: boolean,
    hooks?: {
        onGetAll?: GetAllCookies
        onSetAll?: SetAllCookies
    }
) {
    if (useSecretKey) {
        return createClient(ServerEnv.NEXT_SUPABASE_URL, ServerEnv.NEXT_SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
        })
    }

    const [cookieStore, headersStore] = await Promise.all([cookies(), headers()])

    return createServerClient(
        ServerEnv.NEXT_SUPABASE_URL,
        ServerEnv.NEXT_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll() {
                    const result = cookieStore.getAll()
                    hooks?.onGetAll?.()
                    return result
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                    }

                    hooks?.onSetAll?.(
                        cookiesToSet,
                        headersStore as unknown as Record<string, string>
                    )
                },
            },
        }
    )
}

/**
 * Compares an API key against an expected value using a timing-safe comparison
 * to prevent timing attacks.
 * @param apiKey - The API key to verify.
 * @param expected - The expected API key value.
 */
export function verifyApiKey(apiKey: string, expected: string): boolean {
    if (apiKey.length !== expected.length) return false

    return timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected))
}
