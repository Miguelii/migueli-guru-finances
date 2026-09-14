import { describe, it, expect, vi } from 'vitest'
import { isJwtRejection } from '@/_trpc/utils'

vi.mock('server-only', () => ({}))
vi.mock('@/_bff/modules/auth/get-cached-user-id.helper', () => ({
    getCachedUserId: vi.fn(),
}))

describe('isJwtRejection', () => {
    it.each(['PGRST301', 'PGRST302', 'PGRST303'])(
        'returns true for the PostgREST JWT error code %s',
        (code) => {
            expect(isJwtRejection({ code, message: 'JWT expired' })).toBe(true)
        }
    )

    it('returns false for other PostgREST error codes', () => {
        expect(isJwtRejection({ code: 'PGRST116', message: 'No rows' })).toBe(false)
        expect(isJwtRejection({ code: '42501', message: 'permission denied' })).toBe(false)
    })

    it('returns false when the code is not a string', () => {
        expect(isJwtRejection({ code: 301 })).toBe(false)
        expect(isJwtRejection({ code: null })).toBe(false)
    })

    it('returns false when the cause has no code', () => {
        expect(isJwtRejection({ message: 'JWT expired' })).toBe(false)
        expect(isJwtRejection(new Error('JWT expired'))).toBe(false)
    })

    it.each([undefined, null, 'PGRST301', 301, true])(
        'returns false for the non-object cause %s',
        (cause) => {
            expect(isJwtRejection(cause)).toBe(false)
        }
    )
})
