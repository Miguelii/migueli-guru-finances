import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSbServerClient, verifyApiKey } from '@/_bff/common/supabase/supabase.client'
import { createServerClient } from '@supabase/ssr'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock next/headers (cookies + headers)
const mockGetAll = vi.fn(() => [{ name: 'sb-token', value: 'abc' }])
const mockSet = vi.fn()
vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => ({
        getAll: mockGetAll,
        set: mockSet,
    })),
    headers: vi.fn(async () => new Headers()),
}))

// Mock @supabase/ssr
const mockSupabaseClient = {
    auth: {
        getClaims: vi.fn(),
    },
}
vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(() => mockSupabaseClient),
}))

// Mock ServerEnv
vi.mock('@/env/server', () => ({
    ServerEnv: {
        NEXT_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_SUPABASE_PUBLISHABLE_KEY: 'test-key',
    },
}))

// ─── verifyApiKey ────────────────────────────────────────────────────────────

describe('verifyApiKey', () => {
    it('should return true for matching keys', () => {
        expect(verifyApiKey('my-secret-key', 'my-secret-key')).toBe(true)
    })

    it('should return false for different keys of same length', () => {
        expect(verifyApiKey('aaaa-bbbb-cccc', 'xxxx-yyyy-zzzz')).toBe(false)
    })

    it('should return false for keys of different lengths', () => {
        expect(verifyApiKey('short', 'much-longer-key')).toBe(false)
    })

    it('should return false for empty vs non-empty key', () => {
        expect(verifyApiKey('', 'secret')).toBe(false)
    })

    it('should return true for two empty strings', () => {
        expect(verifyApiKey('', '')).toBe(true)
    })
})

// ─── createSbServerClient ────────────────────────────────────────────────────

describe('createSbServerClient', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should call createServerClient with correct env values', async () => {
        await createSbServerClient()

        expect(createServerClient).toHaveBeenCalledWith(
            'https://test.supabase.co',
            'test-key',
            expect.objectContaining({
                cookies: expect.objectContaining({
                    getAll: expect.any(Function),
                    setAll: expect.any(Function),
                }),
            })
        )
    })

    it('should use cookieStore.getAll by default', async () => {
        await createSbServerClient()

        // Extract the getAll handler passed to createServerClient
        const cookieHandlers = vi.mocked(createServerClient).mock.calls[0][2].cookies as {
            getAll: () => { name: string; value: string }[]
        }
        const result = cookieHandlers.getAll()

        expect(mockGetAll).toHaveBeenCalled()
        expect(result).toEqual([{ name: 'sb-token', value: 'abc' }])
    })

    it('should call onGetAll hook after default getAll', async () => {
        const onGetAll = vi.fn()
        await createSbServerClient(false, { onGetAll })

        const cookieHandlers = vi.mocked(createServerClient).mock.calls[0][2].cookies as {
            getAll: () => { name: string; value: string }[]
        }
        cookieHandlers.getAll()

        expect(mockGetAll).toHaveBeenCalled()
        expect(onGetAll).toHaveBeenCalled()
    })

    it('should call onSetAll hook after default setAll', async () => {
        const onSetAll = vi.fn()
        await createSbServerClient(false, { onSetAll })

        const cookiesToSet = [{ name: 'sb-token', value: 'xyz', options: {} }]
        const cookieHandlers = vi.mocked(createServerClient).mock.calls[0][2].cookies as {
            setAll: (
                cookies: { name: string; value: string; options: object }[],
                headers?: Record<string, string>
            ) => void
        }
        cookieHandlers.setAll(cookiesToSet)

        expect(mockSet).toHaveBeenCalledWith('sb-token', 'xyz', {})
        expect(onSetAll).toHaveBeenCalledWith(cookiesToSet, expect.anything())
    })

    it('should swallow errors from cookieStore.set (Server Component context)', async () => {
        mockSet.mockImplementation(() => {
            throw new Error('Cannot set cookies in Server Component')
        })

        await createSbServerClient()

        const cookieHandlers = vi.mocked(createServerClient).mock.calls[0][2].cookies as {
            setAll: (
                cookies: { name: string; value: string; options: object }[],
                headers?: Record<string, string>
            ) => void
        }

        // Should not throw
        expect(() =>
            cookieHandlers.setAll([{ name: 'sb-token', value: 'xyz', options: {} }])
        ).not.toThrow()
    })

    it('should call onSetAll when cookieStore.set fails', async () => {
        mockSet.mockImplementation(() => {
            throw new Error('Cannot set cookies in Server Component')
        })
        const onSetAll = vi.fn()

        await createSbServerClient(false, { onSetAll })

        const cookiesToSet = [{ name: 'sb-token', value: 'xyz', options: {} }]
        const cookieHandlers = vi.mocked(createServerClient).mock.calls[0][2]
            .cookies as unknown as {
            setAll: (
                cookies: { name: string; value: string; options: object }[],
                headers?: Record<string, string>
            ) => void
        }
        cookieHandlers.setAll(cookiesToSet)

        expect(onSetAll).toHaveBeenCalledWith(cookiesToSet, expect.anything())
    })
})
