import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sbProxy } from '@/lib/utils.server'
import { NextRequest } from 'next/server'

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

// ─── sbProxy ─────────────────────────────────────────────────────────────────

describe('sbProxy', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return a response when user is authenticated', async () => {
        mockSupabaseClient.auth.getClaims.mockResolvedValue({
            data: { claims: { sub: 'user-123' } },
        })

        const request = new NextRequest('http://localhost:3000/portfolio')
        const response = await sbProxy(request)

        expect(response.status).toBe(200)
    })

    it('should redirect unauthenticated users from /portfolio to /', async () => {
        mockSupabaseClient.auth.getClaims.mockResolvedValue({
            data: { claims: null },
        })

        const request = new NextRequest('http://localhost:3000/portfolio')
        const response = await sbProxy(request)

        expect(response.status).toBe(307)
        expect(new URL(response.headers.get('location')!).pathname).toBe('/')
    })

    it('should not redirect unauthenticated users on public routes', async () => {
        mockSupabaseClient.auth.getClaims.mockResolvedValue({
            data: { claims: null },
        })

        const request = new NextRequest('http://localhost:3000/')
        const response = await sbProxy(request)

        expect(response.status).toBe(200)
    })
})
