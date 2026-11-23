import { describe, expect, it } from 'vitest'
import { toCurrentUser } from '@/_bff/modules/auth/helpers/current-user.helper'

describe('toCurrentUser', () => {
    it('uses the trimmed full name from the metadata', () => {
        expect(toCurrentUser({ user_metadata: { full_name: ' Jane Mary Doe ' } })).toEqual({
            name: 'Jane Mary Doe',
        })
    })

    it('falls back to the other name keys in order', () => {
        expect(toCurrentUser({ user_metadata: { name: '', display_name: 'ana' } })).toEqual({
            name: 'ana',
        })
    })

    it('returns no name when the metadata has none', () => {
        expect(toCurrentUser({ user_metadata: {} })).toEqual({ name: null })
    })

    it('ignores name fields that are not strings', () => {
        expect(toCurrentUser({ user_metadata: { name: 42 } })).toEqual({ name: null })
    })
})
