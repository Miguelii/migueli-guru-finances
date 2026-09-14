import { describe, it, expect, vi } from 'vitest'
import {
    AuthApiError,
    AuthRetryableFetchError,
    AuthSessionMissingError,
} from '@supabase/supabase-js'
import { isInvalidSessionError } from '@/_bff/modules/auth/get-session.helper'

vi.mock('server-only', () => ({}))
vi.mock('@/_bff/common/db/db.utils', () => ({ createDBServerClient: vi.fn() }))

describe('isInvalidSessionError', () => {
    it('treats a missing session as invalid', () => {
        expect(isInvalidSessionError(new AuthSessionMissingError())).toBe(true)
    })

    it.each([400, 401, 403, 404])('treats auth API status %i as invalid', (status) => {
        expect(isInvalidSessionError(new AuthApiError('rejected', status, undefined))).toBe(true)
    })

    it('does not treat Supabase Auth outages as invalid sessions', () => {
        expect(isInvalidSessionError(new AuthApiError('boom', 500, undefined))).toBe(false)
        expect(isInvalidSessionError(new AuthRetryableFetchError('network', 0))).toBe(false)
        expect(isInvalidSessionError(new Error('unknown'))).toBe(false)
    })
})
