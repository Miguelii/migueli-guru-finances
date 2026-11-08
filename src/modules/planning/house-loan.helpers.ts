import {
    AFFORDABILITY_LATER_MONTHS,
    HEALTHY_PAYMENT_EUR,
    MIN_DOWN_PAYMENT_RATIO,
} from '@/modules/planning/house-planner-card.constants'

export const MONTHS_PER_YEAR = 12

export type Loan = {
    annualRatePct: number
    termYears: number
}

/**
 * Monthly payment per euro borrowed on a constant-payment loan (the French amortization
 * used by Portuguese banks). Multiplying it by the loan gives the payment, dividing a
 * payment by it gives the loan.
 *
 * @param loan.annualRatePct - Nominal yearly rate in percent (`4` = 4%).
 * @param loan.termYears - Loan term in years.
 */
export function getPaymentFactor({ annualRatePct, termYears }: Loan): number {
    const months = termYears * MONTHS_PER_YEAR
    const monthlyRate = annualRatePct / 100 / MONTHS_PER_YEAR

    if (monthlyRate === 0) return 1 / months

    return monthlyRate / (1 - (1 + monthlyRate) ** -months)
}

/**
 * Months of saving needed to reach a target, rounded up to whole months.
 *
 * @param targetEur - Amount to reach.
 * @param savedEur - Amount already saved.
 * @param monthlySavingEur - Amount added every month.
 * @returns `0` when already reached, `null` when it can never be reached.
 */
export function getMonthsToSave(
    targetEur: number,
    savedEur: number,
    monthlySavingEur: number
): number | null {
    const remainingEur = targetEur - savedEur

    if (remainingEur <= 0) return 0
    if (monthlySavingEur <= 0) return null

    return Math.ceil(remainingEur / monthlySavingEur)
}

/**
 * Down payment needed for a house to cost a given monthly payment, never below the
 * minimum the bank requires.
 *
 * @param priceEur - House price.
 * @param monthlyPaymentEur - Desired monthly payment.
 * @param paymentFactor - Result of `getPaymentFactor`.
 */
export function getDownPaymentForPayment(
    priceEur: number,
    monthlyPaymentEur: number,
    paymentFactor: number
): number {
    const maxLoanEur = monthlyPaymentEur / paymentFactor

    return Math.max(priceEur - maxLoanEur, priceEur * MIN_DOWN_PAYMENT_RATIO)
}

/**
 * Most expensive house affordable with some savings and a monthly payment. Limited by
 * the loan that payment supports and by the minimum down payment the bank requires.
 *
 * @param savedEur - Amount available as down payment.
 * @param monthlyPaymentEur - Monthly payment to stay within.
 * @param paymentFactor - Result of `getPaymentFactor`.
 */
export function getAffordablePrice(
    savedEur: number,
    monthlyPaymentEur: number,
    paymentFactor: number
): number {
    const maxLoanEur = monthlyPaymentEur / paymentFactor

    return Math.min(savedEur + maxLoanEur, savedEur / MIN_DOWN_PAYMENT_RATIO)
}

/**
 * Price a payment at the top of the healthy range can buy, now and some months ahead.
 *
 * @param savedEur - Amount already saved.
 * @param monthlySavingEur - Amount saved every month.
 * @param paymentFactor - Result of `getPaymentFactor`.
 */
export function getAffordability(
    savedEur: number,
    monthlySavingEur: number,
    paymentFactor: number
): { todayEur: number; laterEur: number } {
    const priceFor = (amountEur: number) =>
        getAffordablePrice(amountEur, HEALTHY_PAYMENT_EUR.max, paymentFactor)

    return {
        todayEur: priceFor(savedEur),
        laterEur: priceFor(savedEur + monthlySavingEur * AFFORDABILITY_LATER_MONTHS),
    }
}
