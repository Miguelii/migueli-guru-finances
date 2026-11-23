import { describe, expect, it } from 'vitest'
import { getFirstName, getGreeting } from '@/modules/dashboard/dashboard-greeting.helpers'

describe('getGreeting', () => {
    // Lisbon is UTC+0 in winter, so these UTC instants are also the local hour
    it.each([
        ['2026-01-10T05:00:00Z', 'Good morning'],
        ['2026-01-10T11:59:00Z', 'Good morning'],
        ['2026-01-10T12:00:00Z', 'Good afternoon'],
        ['2026-01-10T19:00:00Z', 'Good evening'],
        ['2026-01-10T02:00:00Z', 'Good evening'],
    ])('at %s says %s', (iso, expected) => {
        expect(getGreeting(new Date(iso))).toBe(expected)
    })

    it('uses the Lisbon hour in summer time', () => {
        // 11:30 UTC is 12:30 in Lisbon (UTC+1)
        expect(getGreeting(new Date('2026-07-10T11:30:00Z'))).toBe('Good afternoon')
    })
})

describe('getFirstName', () => {
    it('returns the first word of the name', () => {
        expect(getFirstName('Jane Mary Doe')).toBe('Jane')
    })

    it('returns null without a name', () => {
        expect(getFirstName(null)).toBeNull()
    })
})
