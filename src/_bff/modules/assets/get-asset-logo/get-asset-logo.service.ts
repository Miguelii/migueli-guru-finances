import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { Logger } from '@/_bff/common/logger/logger'
import { assetLogoPathSchema } from '@/_bff/modules/assets/assets.dto'
import { GetAssetLogoError } from '@/_bff/modules/assets/assets.errors'
import { buildBucketAssetUrl } from '@/lib/utils.server'
import { Effect } from 'effect'
import { NextResponse } from 'next/server'

export const getAssetLogo = Effect.fn('getAssetLogo')(function* (rawPath: string | null) {
    const parsed = assetLogoPathSchema.safeParse(rawPath)

    if (!parsed.success) {
        return new NextResponse('invalid path', { status: 400 })
    }

    const path = parsed.data

    const response = yield* Effect.tryPromise({
        try: async () => {
            const res = await fetch(buildBucketAssetUrl(path), { cache: 'force-cache' })
            if (!res.ok) throw new Error(`unexpected status ${res.status}`)

            return new NextResponse(await res.arrayBuffer(), {
                headers: {
                    'Content-Type': res.headers.get('content-type') ?? 'image/webp',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            })
        },
        catch: (cause) => new GetAssetLogoError({ cause, error_hash: ErrorCode.ASSETS_LOGO_FETCH }),
    }).pipe(
        Effect.catchAll((error) => {
            Logger.error(`[getAssetLogo] failed to fetch logo PATH=|${path}|`, error)
            return Effect.succeed(new NextResponse('not found', { status: 404 }))
        })
    )

    return response
})
