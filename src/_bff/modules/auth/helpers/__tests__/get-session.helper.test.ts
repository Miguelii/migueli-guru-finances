import { describe, it, expect, vi } from 'vitest'
import {
    AuthApiError,
    AuthInvalidJwtError,
    AuthRetryableFetchError,
    AuthSessionMissingError,
    type JwtPayload,
} from '@supabase/supabase-js'
import {
    isInvalidSessionError,
    toSessionUser,
} from '@/_bff/modules/auth/helpers/get-session.helper'

vi.mock('server-only', () => ({}))
vi.mock('@/_bff/common/db/db.utils', () => ({ createDBServerClient: vi.fn() }))

describe('isInvalidSessionError', () => {
    it('treats a missing session as invalid', () => {
        expect(isInvalidSessionError(new AuthSessionMissingError())).toBe(true)
    })

    it.each([400, 401, 403, 404])('treats auth API status %i as invalid', (status) => {
        expect(isInvalidSessionError(new AuthApiError('rejected', status, undefined))).toBe(true)
    })

    it('treats an invalid JWT as an invalid session', () => {
        expect(isInvalidSessionError(new AuthInvalidJwtError('bad signature'))).toBe(true)
    })

    it('does not treat Supabase Auth outages as invalid sessions', () => {
        expect(isInvalidSessionError(new AuthApiError('boom', 500, undefined))).toBe(false)
        expect(isInvalidSessionError(new AuthRetryableFetchError('network', 0))).toBe(false)
        expect(isInvalidSessionError(new Error('unknown'))).toBe(false)
    })
})

function buildClaims(overrides: Partial<JwtPayload> = {}): JwtPayload {
    return {
        iss: 'https://example.supabase.co/auth/v1',
        aud: 'authenticated',
        exp: 0,
        iat: 0,
        role: 'authenticated',
        aal: 'aal1',
        session_id: 'session-1',
        sub: 'user-1',
        ...overrides,
    }
}

describe('toSessionUser', () => {
    it('maps the sub claim to the user id', () => {
        const user = toSessionUser(buildClaims({ user_metadata: { full_name: 'Ana' } }))
        expect(user).toEqual({ id: 'user-1', user_metadata: { full_name: 'Ana' } })
    })

    it('defaults missing metadata to an empty object', () => {
        expect(toSessionUser(buildClaims()).user_metadata).toEqual({})
    })
})
