import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { SbBuckets, type SbClient } from '@/_bff/common/supabase/types'
import { UploadAssetImageError } from '@/_bff/modules/assets/assets.errors'
import { Effect } from 'effect'
import sharp from 'sharp'

/**
 * Converts a base64 data-URL image to WebP and uploads it to the bucket.
 * The returned logo path carries a `?v=<timestamp>` suffix for cache busting —
 * the bucket file name stays stable (upsert) but each new upload changes the URL.
 *
 * @param supabase - Supabase client for the current request
 * @param ticker - Asset ticker (lowercased and with `.`/`-`/`=` replaced by `_` for the file name, e.g. `NVD.DE` → `nvd_de.webp`)
 * @param image - Image as a base64 data URL
 */
export const uploadAssetImage = Effect.fn('uploadAssetImage')(function* (
    supabase: SbClient,
    ticker: string,
    image: string
) {
    const fileName = `${ticker.toLowerCase().replaceAll(/[^a-z0-9]/gu, '_')}.webp`

    const webpBuffer = yield* Effect.tryPromise({
        try: () => {
            const buffer = Buffer.from(image.split(',')[1] ?? '', 'base64')
            return sharp(buffer).webp({ quality: 90, effort: 6 }).toBuffer()
        },
        catch: (cause) =>
            new UploadAssetImageError({ cause, error_hash: ErrorCode.ASSETS_IMAGE_UPLOAD }),
    })

    const { error } = yield* Effect.tryPromise({
        try: () =>
            supabase.storage.from(SbBuckets.PUBLIC_ASSETS).upload(fileName, webpBuffer, {
                contentType: 'image/webp',
                upsert: true,
            }),
        catch: (cause) =>
            new UploadAssetImageError({ cause, error_hash: ErrorCode.ASSETS_IMAGE_UPLOAD }),
    })

    if (error) {
        return yield* new UploadAssetImageError({
            cause: error,
            message: error.message,
            error_hash: ErrorCode.ASSETS_IMAGE_UPLOAD,
        })
    }

    return `/${fileName}?v=${Date.now()}`
})
