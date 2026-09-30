import { BankSyncStatus, type BankBalanceSummary } from '@/types/BankConnection'
import { Currency } from '@/types/Transaction'
import {
    CONSENT_EXPIRING_THRESHOLD_DAYS,
    EmergencyFundStatus,
} from '@/modules/emergency-fund/emergency-fund-card.constants'

const DAY_MS = 24 * 60 * 60 * 1000

const dateTimeFormatter = new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Lisbon',
})

/**
 * Whole days left until the given date (rounded up, negative once it has passed).
 * Returns `null` when there is no date.
 *
 * @param dateIso - ISO timestamp
 * @param now - Reference time in ms (defaults to now)
 */
export function getDaysUntil(dateIso: string | null, now = Date.now()): number | null {
    if (!dateIso) return null

    return Math.ceil((new Date(dateIso).getTime() - now) / DAY_MS)
}

/**
 * Derives the card status: consent expiry takes precedence over a sync error, and a
 * consent close to expiring is flagged so it can be renewed in time. A rate-limited sync
 * (bank's daily quota used up) only shows when nothing needs the user's action.
 *
 * @param summary - Bank connection summary from `bank.get`
 * @param now - Reference time in ms (defaults to now)
 */
export function getEmergencyFundStatus(
    summary: BankBalanceSummary,
    now = Date.now()
): EmergencyFundStatus {
    if (!summary.isConfigured) return EmergencyFundStatus.NotConfigured

    if (summary.loadFailed) return EmergencyFundStatus.Unavailable

    if (!summary.isConnected) return EmergencyFundStatus.NotConnected

    const daysLeft = getDaysUntil(summary.consentValidUntil, now)

    if (summary.lastSyncStatus === BankSyncStatus.Expired || (daysLeft !== null && daysLeft <= 0)) {
        return EmergencyFundStatus.Expired
    }

    if (summary.lastSyncStatus === BankSyncStatus.Error) return EmergencyFundStatus.Error

    if (daysLeft !== null && daysLeft <= CONSENT_EXPIRING_THRESHOLD_DAYS) {
        return EmergencyFundStatus.Expiring
    }

    if (summary.lastSyncStatus === BankSyncStatus.RateLimited) {
        return EmergencyFundStatus.RateLimited
    }

    return EmergencyFundStatus.Ok
}

export function formatDaysLeft(days: number): string {
    return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function formatDateTime(dateIso: string): string {
    return dateTimeFormatter.format(new Date(dateIso))
}

/**
 * Maps the bank's ISO currency code to a supported `Currency`, falling back to EUR.
 *
 * @param code - ISO 4217 code reported by the bank
 */
export function toDisplayCurrency(code: string | null): Currency {
    return Object.values(Currency).find((currency) => currency === code) ?? Currency.EUR
}
