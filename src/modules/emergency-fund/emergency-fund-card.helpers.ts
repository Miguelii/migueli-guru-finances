import { BankSyncStatus, type BankBalanceSummary } from '@/types/BankConnection'
import { Currency } from '@/types/core/Currency'
import {
    CAR_INSURANCE_DUE_MONTH,
    CAR_INSURANCE_GOAL,
    CONSENT_EXPIRING_THRESHOLD_DAYS,
    EMERGENCY_FUND_GOAL,
    EmergencyFundStatus,
    TOTAL_GOAL,
} from '@/modules/emergency-fund/emergency-fund-card.constants'

const DAY_MS = 24 * 60 * 60 * 1000

const dateTimeFormatter = new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Lisbon',
})

const dueMonthFormatter = new Intl.DateTimeFormat('pt-PT', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
})

export type FundBucket = {
    saved: number
    goal: number
    missing: number
    isComplete: boolean
}

type EmergencyFundPlan = {
    fund: FundBucket
    insurance: FundBucket & {
        dueDate: Date
        monthsLeft: number
        isDueThisMonth: boolean
        monthly: number
    }
    surplus: number
    thisMonthTotal: number
}

const roundCents = (value: number) => Math.round(value * 100) / 100

const toBucket = (saved: number, goal: number): FundBucket => ({
    saved,
    goal,
    missing: roundCents(goal - saved),
    isComplete: saved >= goal,
})

/**
 * Splits the bank balance into the emergency fund (filled first) and the car insurance
 * (the rest), and works out what to add: the fund gap as a one-off top-up and the
 * insurance gap spread over the months left until the next due June. In the due month
 * itself the whole insurance gap is due at once.
 *
 * @param balance - Current bank balance
 * @param now - Reference date (defaults to now), read in UTC
 */
export function getEmergencyFundPlan(balance: number, now = new Date()): EmergencyFundPlan {
    const fundSaved = Math.min(Math.max(balance, 0), EMERGENCY_FUND_GOAL)
    const insuranceSaved = Math.min(Math.max(balance - EMERGENCY_FUND_GOAL, 0), CAR_INSURANCE_GOAL)

    const fund = toBucket(fundSaved, EMERGENCY_FUND_GOAL)
    const insuranceBucket = toBucket(insuranceSaved, CAR_INSURANCE_GOAL)

    const month = now.getUTCMonth() + 1
    const dueYear = now.getUTCFullYear() + (month > CAR_INSURANCE_DUE_MONTH ? 1 : 0)
    const monthsLeft = Math.max(
        (dueYear - now.getUTCFullYear()) * 12 + CAR_INSURANCE_DUE_MONTH - month,
        1
    )
    const monthly = roundCents(insuranceBucket.missing / monthsLeft)

    return {
        fund,
        insurance: {
            ...insuranceBucket,
            dueDate: new Date(Date.UTC(dueYear, CAR_INSURANCE_DUE_MONTH - 1, 1)),
            monthsLeft,
            isDueThisMonth: month === CAR_INSURANCE_DUE_MONTH,
            monthly,
        },
        surplus: roundCents(Math.max(balance - TOTAL_GOAL, 0)),
        thisMonthTotal: roundCents(fund.missing + monthly),
    }
}

export function formatDueMonth(date: Date): string {
    return dueMonthFormatter.format(date)
}

export function formatMonthsLeft(months: number): string {
    return `${months} ${months === 1 ? 'month' : 'months'}`
}

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
