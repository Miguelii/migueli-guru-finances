import { describe, it, expect } from 'vitest'
import { buildLogSearchFilter } from '@/_bff/modules/logs/helpers/log-search-filter.helper'

describe('buildLogSearchFilter', () => {
    it('matches message or prefix with a quoted ilike pattern', () => {
        expect(buildLogSearchFilter('timeout')).toBe(
            'message.ilike."%timeout%",prefix.ilike."%timeout%"'
        )
    })

    it('escapes LIKE wildcards so they match literally', () => {
        expect(buildLogSearchFilter('50%_off')).toBe(
            String.raw`message.ilike."%50\\%\\_off%",prefix.ilike."%50\\%\\_off%"`
        )
    })

    it('keeps reserved PostgREST characters inside the quotes', () => {
        expect(buildLogSearchFilter('a,b(c)"d')).toBe(
            String.raw`message.ilike."%a,b(c)\"d%",prefix.ilike."%a,b(c)\"d%"`
        )
    })
})
