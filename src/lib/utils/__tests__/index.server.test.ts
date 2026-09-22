import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sbProxy } from '@/lib/utils/index.server'
import { NextRequest } from 'next/server'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock the DB client factory (sbProxy's direct dependency)
const mockGetClaims = vi.fn()
vi.mock('@/_bff/common/db/db.utils', () => ({
    createDBServerClient: vi.fn(async () => ({ auth: { getClaims: mockGetClaims } })),
}))

// Mock ServerEnv
vi.mock('@/env/server', () => ({
    ServerEnv: {
        NEXT_SUPABASE_URL: 'https://test.supabase.co',
    },
}))

// ─── sbProxy ─────────────────────────────────────────────────────────────────

describe('sbProxy', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return a response when user is authenticated', async () => {
        mockGetClaims.mockResolvedValue({
            data: { claims: { sub: 'user-123' } },
        })

        const request = new NextRequest('http://localhost:3000/portfolio')
        const response = await sbProxy(request)

        expect(response.status).toBe(200)
    })

    it('should redirect unauthenticated users from /portfolio to /', async () => {
        mockGetClaims.mockResolvedValue({
            data: { claims: null },
        })

        const request = new NextRequest('http://localhost:3000/portfolio')
        const response = await sbProxy(request)

        expect(response.status).toBe(307)
        expect(new URL(response.headers.get('location')!).pathname).toBe('/')
    })

    it('should not redirect unauthenticated users on public routes', async () => {
        mockGetClaims.mockResolvedValue({
            data: { claims: null },
        })

        const request = new NextRequest('http://localhost:3000/')
        const response = await sbProxy(request)

        expect(response.status).toBe(200)
    })
})
