import type { NextRequest } from 'next/server'
import { setCSP } from '@/lib/set-csp'
import { sbProxy } from '@/lib/utils.server'

export async function proxy(request: NextRequest) {
    const response = await sbProxy(request)
    return setCSP(response)
}

// Static assets are excluded via matcher and get their headers from
// next.config.ts headers() — served at the CDN level, no proxy invocation.
// Must be a plain string literal: the matcher is extracted by static analysis,
// so template literals/String.raw are silently dropped ([.] = literal dot)
export const config = {
    matcher: [
        '/((?!_next|api/|assets|favicon|robots[.]txt|script|sw[.]js|apple-touch-icon|web-app-manifest).*)',
    ],
}
