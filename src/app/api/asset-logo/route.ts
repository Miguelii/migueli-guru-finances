import { getAssetLogo } from '@/_bff/modules/assets/get-asset-logo/get-asset-logo.service'
import { Effect } from 'effect'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    return Effect.runPromise(getAssetLogo(request.nextUrl.searchParams.get('path')))
}
