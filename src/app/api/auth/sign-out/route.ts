import { NextResponse, type NextRequest } from 'next/server'
import { Effect } from 'effect'
import { HOME_PAGE_PATH } from '@/lib/constants'
import { forceSignOut } from '@/_bff/modules/auth/force-sign-out/force-sign-out.service'

export const dynamic = 'force-dynamic'

// GET so that Server Components can reach it through `redirect()` when a tRPC call
// returns UNAUTHORIZED.
export async function GET(request: NextRequest) {
    await Effect.runPromise(forceSignOut())

    return NextResponse.redirect(new URL(HOME_PAGE_PATH, request.url))
}
