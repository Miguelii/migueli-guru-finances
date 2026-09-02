import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { HOME_PAGE_PATH, PRIVATE_ROUTE_PATH } from '@/lib/constants'
import { createDBServerClient } from '@/_bff/common/db/db.utils'
import { ServerEnv } from '@/env/server'

/**
 * Supabase auth proxy for Next.js middleware.
 * Refreshes the user session via `getClaims()` and syncs auth cookies
 * between the incoming request and outgoing response.
 * Redirects unauthenticated users away from protected routes.
 * @param request - The incoming Next.js middleware request.
 */
export async function sbProxy(request: NextRequest) {
    let response = NextResponse.next({
        request,
    })

    // With Fluid compute, don't put this client in a global environment
    // variable. Always create a new one on each request.
    const bd = await createDBServerClient(false, {
        onSetAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
                request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
            )
        },
    })

    // Do not run code between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    // IMPORTANT: If you remove getClaims() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.
    const { data } = await bd.auth.getClaims()

    const user = data?.claims

    if (!user && request.nextUrl.pathname.startsWith(PRIVATE_ROUTE_PATH)) {
        const url = request.nextUrl.clone()
        url.pathname = HOME_PAGE_PATH
        return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname === HOME_PAGE_PATH && user != null) {
        const url = request.nextUrl.clone()
        url.pathname = PRIVATE_ROUTE_PATH
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!
    return response
}

export const buildBucketAssetUrl = (path: string) => {
    return `${ServerEnv.NEXT_SUPABASE_URL}/storage/v1/object/public/public_assets${path}`
}

export const getIsDev = (): boolean => {
    return process.env.NODE_ENV === 'development'
}
