import { describe, expect, it } from 'vitest'
import { getPageTitle } from '@/components/app-header/page-heading.helpers'
import { POSITIONS_ROUTE_PATH, PRIVATE_ROUTE_PATH } from '@/lib/constants'

describe('getPageTitle', () => {
    it('returns null on the dashboard', () => {
        expect(getPageTitle(PRIVATE_ROUTE_PATH)).toBeNull()
    })

    it('returns the navigation title of a page', () => {
        expect(getPageTitle(POSITIONS_ROUTE_PATH)).toBe('Positions')
    })

    it('returns null for routes outside the navigation', () => {
        expect(getPageTitle('/portfolio/unknown')).toBeNull()
    })
})
