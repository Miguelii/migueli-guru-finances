import { describe, it, expect } from 'vitest'
import { BankSyncStatus, type BankBalanceSummary } from '@/types/BankConnection'
import { Currency } from '@/types/Transaction'
import { EmergencyFundStatus } from '@/modules/emergency-fund/emergency-fund-card.constants'
import {
    getDaysUntil,
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
