import { describe, it, expect } from 'vitest'
import { BankSyncStatus, type BankBalanceSummary } from '@/types/BankConnection'
import { Currency } from '@/types/core/Currency'
import { EmergencyFundStatus } from '@/modules/emergency-fund/emergency-fund-card.constants'
import {
    getDaysUntil,
    getEmergencyFundPlan,
    getEmergencyFundStatus,
    toDisplayCurrency,
} from '@/modules/emergency-fund/emergency-fund-card.helpers'

const NOW = new Date('2026-09-27T12:00:00Z').getTime()
const DAY_MS = 24 * 60 * 60 * 1000
const inDays = (days: number) => new Date(NOW + days * DAY_MS).toISOString()

const summary = (overrides: Partial<BankBalanceSummary> = {}): BankBalanceSummary => ({
    isConfigured: true,
    loadFailed: false,
    isConnected: true,
    balance: 10_000,
    currency: 'EUR',
    balanceUpdatedAt: inDays(0),
    consentValidUntil: inDays(60),
    lastSyncStatus: BankSyncStatus.Ok,
    ...overrides,
})

describe('getDaysUntil', () => {
    it('should round partial days up', () => {
        expect(getDaysUntil(new Date(NOW + DAY_MS / 2).toISOString(), NOW)).toBe(1)
    })

    it('should be negative once the date has passed', () => {
        expect(getDaysUntil(inDays(-3), NOW)).toBe(-3)
    })

    it('should return null without a date', () => {
        expect(getDaysUntil(null, NOW)).toBeNull()
    })
})

describe('getEmergencyFundStatus', () => {
    it('should be NOT_CONFIGURED when the bank integration is not set up', () => {
        expect(
            getEmergencyFundStatus(summary({ isConfigured: false, isConnected: false }), NOW)
        ).toBe(EmergencyFundStatus.NotConfigured)
    })

    it('should be UNAVAILABLE when the connection could not be loaded', () => {
        expect(getEmergencyFundStatus(summary({ loadFailed: true, isConnected: false }), NOW)).toBe(
            EmergencyFundStatus.Unavailable
        )
    })

    it('should be NOT_CONNECTED without an authorized account', () => {
        expect(getEmergencyFundStatus(summary({ isConnected: false }), NOW)).toBe(
            EmergencyFundStatus.NotConnected
        )
    })

    it('should be OK with a healthy, long-lived consent', () => {
        expect(getEmergencyFundStatus(summary(), NOW)).toBe(EmergencyFundStatus.Ok)
    })

    it('should be EXPIRING within the renewal threshold', () => {
        expect(getEmergencyFundStatus(summary({ consentValidUntil: inDays(14) }), NOW)).toBe(
            EmergencyFundStatus.Expiring
        )
    })

    it('should be EXPIRED once the consent date has passed', () => {
        expect(getEmergencyFundStatus(summary({ consentValidUntil: inDays(-1) }), NOW)).toBe(
            EmergencyFundStatus.Expired
        )
    })

    it('should be EXPIRED when the bank revoked the consent early', () => {
        expect(
            getEmergencyFundStatus(summary({ lastSyncStatus: BankSyncStatus.Expired }), NOW)
        ).toBe(EmergencyFundStatus.Expired)
    })

    it('should be ERROR after a failed sync with a valid consent', () => {
        expect(getEmergencyFundStatus(summary({ lastSyncStatus: BankSyncStatus.Error }), NOW)).toBe(
            EmergencyFundStatus.Error
        )
    })

    it('should be RATE_LIMITED, not ERROR, when the bank quota was used up', () => {
        expect(
            getEmergencyFundStatus(summary({ lastSyncStatus: BankSyncStatus.RateLimited }), NOW)
        ).toBe(EmergencyFundStatus.RateLimited)
    })

    it('should still ask to renew a rate-limited connection close to expiring', () => {
        expect(
            getEmergencyFundStatus(
                summary({
                    lastSyncStatus: BankSyncStatus.RateLimited,
                    consentValidUntil: inDays(5),
                }),
                NOW
            )
        ).toBe(EmergencyFundStatus.Expiring)
    })
})

describe('toDisplayCurrency', () => {
    it('should keep supported currencies', () => {
        expect(toDisplayCurrency('USD')).toBe(Currency.USD)
    })

    it('should fall back to EUR for unknown or missing codes', () => {
        expect(toDisplayCurrency('GBP')).toBe(Currency.EUR)
        expect(toDisplayCurrency(null)).toBe(Currency.EUR)
    })
})

describe('getEmergencyFundPlan', () => {
    const OCTOBER = new Date('2026-10-30T12:00:00Z')

    it('should top up the fund now and spread the insurance until next June', () => {
        const plan = getEmergencyFundPlan(3_509.58, OCTOBER)

        expect(plan.fund).toEqual({
            saved: 3_509.58,
            goal: 4_000,
            missing: 490.42,
            isComplete: false,
        })
        expect(plan.insurance.saved).toBe(0)
        expect(plan.insurance.dueDate.toISOString()).toBe('2027-06-01T00:00:00.000Z')
        expect(plan.insurance.monthsLeft).toBe(8)
        expect(plan.insurance.monthly).toBe(125)
        expect(plan.thisMonthTotal).toBe(615.42)
        expect(plan.surplus).toBe(0)
    })

    it('should count the balance above the fund goal towards the insurance', () => {
        const plan = getEmergencyFundPlan(4_300, OCTOBER)

        expect(plan.fund.isComplete).toBe(true)
        expect(plan.fund.missing).toBe(0)
        expect(plan.insurance.saved).toBe(300)
        expect(plan.insurance.monthly).toBe(87.5)
        expect(plan.thisMonthTotal).toBe(87.5)
    })

    it('should report a surplus and nothing to add once both goals are met', () => {
        const plan = getEmergencyFundPlan(5_600, OCTOBER)

        expect(plan.insurance.isComplete).toBe(true)
        expect(plan.surplus).toBe(600)
        expect(plan.thisMonthTotal).toBe(0)
    })

    it('should target June of the same year before the due month', () => {
        const plan = getEmergencyFundPlan(4_000, new Date('2027-03-15T12:00:00Z'))

        expect(plan.insurance.dueDate.toISOString()).toBe('2027-06-01T00:00:00.000Z')
        expect(plan.insurance.monthsLeft).toBe(3)
        expect(plan.insurance.monthly).toBe(333.33)
    })

    it('should ask for the whole gap in the due month', () => {
        const plan = getEmergencyFundPlan(4_400, new Date('2027-06-10T12:00:00Z'))

        expect(plan.insurance.isDueThisMonth).toBe(true)
        expect(plan.insurance.monthsLeft).toBe(1)
        expect(plan.insurance.monthly).toBe(600)
    })

    it('should roll over to next June once the due month has passed', () => {
        const plan = getEmergencyFundPlan(4_000, new Date('2027-07-01T12:00:00Z'))

        expect(plan.insurance.isDueThisMonth).toBe(false)
        expect(plan.insurance.dueDate.toISOString()).toBe('2028-06-01T00:00:00.000Z')
        expect(plan.insurance.monthsLeft).toBe(11)
    })

    it('should treat a negative balance as an empty fund', () => {
        const plan = getEmergencyFundPlan(-150, OCTOBER)

        expect(plan.fund.saved).toBe(0)
        expect(plan.fund.missing).toBe(4_000)
        expect(plan.insurance.missing).toBe(1_000)
        expect(plan.thisMonthTotal).toBe(4_125)
    })
})
