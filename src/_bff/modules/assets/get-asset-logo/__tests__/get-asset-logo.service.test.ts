import { getAssetLogo } from '@/_bff/modules/assets/get-asset-logo/get-asset-logo.service'
import { Effect } from 'effect'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/env/server', () => ({
    ServerEnv: { NEXT_SUPABASE_URL: 'https://project.supabase.co' },
}))

vi.mock('@/_bff/common/logger/logger', () => ({
    Logger: vi.fn(),
}))

const LOGO_PATH = '/logos/btc.webp'

describe('getAssetLogo', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('lets the CDN cache a found logo', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/webp' } })
        )

        const response = await Effect.runPromise(getAssetLogo(LOGO_PATH))

        expect(response.status).toBe(200)
        expect(response.headers.get('CDN-Cache-Control')).toBe(
            'public, max-age=31536000, immutable'
        )
    })

    it('never caches a missing logo', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))

        const response = await Effect.runPromise(getAssetLogo(LOGO_PATH))

        expect(response.status).toBe(404)
        expect(response.headers.get('Cache-Control')).toBe('no-store')
    })
})
