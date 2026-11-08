import { formatCurrency } from '@/lib/portfolio/formaters'
import { Currency } from '@/types/core/Currency'
import {
    DEFAULT_ANNUAL_RATE_PCT,
    DEFAULT_MONTHLY_SAVING_EUR,
    DEFAULT_TERM_YEARS,
    DOWN_PAYMENT_RATIOS,
    HEALTHY_PAYMENT_EUR,
    HEALTHY_STAR_KEY,
    STRETCH_PAYMENT_EUR,
} from '@/modules/planning/house-planner-card.constants'
import {
    getDownPaymentForPayment,
    getMonthsToSave,
    getPaymentFactor,
    MONTHS_PER_YEAR,
    type Loan,
} from '@/modules/planning/house-loan.helpers'
import { toMonthKey } from '@/modules/planning/planning-card.helpers'

const ROUNDING_STEP_EUR = 100

export type PaymentTone = 'healthy' | 'stretch' | 'heavy'

export type HouseStatus = 'locked' | 'reachable' | 'fits'

export type HouseStar = {
    key: string
    label: string
    downPaymentEur: number
    monthlyPaymentEur: number
    /** Months of saving left, `0` when earned, `null` when nothing is being saved */
    monthsToSave: number | null
    /** Month key in `YYYY-MM` format, `null` when it is never reached */
    reachMonth: string | null
    progressPct: number
    isEarned: boolean
}

export type HousePlan = {
    priceEur: number
    stars: HouseStar[]
    status: HouseStatus
    /** Saving goal for a payment at the bottom of the healthy range */
    lowestPaymentGoal: { downPaymentEur: number; monthsToSave: number | null }
}

export type NextStar = {
    priceEur: number
    star: HouseStar
}

type SavingsInput = {
    savedEur: number
    monthlySavingEur: number
    now: Date
}

type HousePlansInput = Omit<SavingsInput, 'now'> & {
    pricesEur: readonly number[]
    loan: Loan
    now?: Date
}

export function getPaymentTone(monthlyPaymentEur: number): PaymentTone {
    if (monthlyPaymentEur <= HEALTHY_PAYMENT_EUR.max) return 'healthy'
    if (monthlyPaymentEur <= STRETCH_PAYMENT_EUR) return 'stretch'

    return 'heavy'
}

function getReachMonth(monthsToSave: number | null, now: Date): string | null {
    if (monthsToSave === null) return null

    return toMonthKey(new Date(now.getFullYear(), now.getMonth() + monthsToSave, 1))
}

/**
 * Builds the three stars of a house: 10% down, 15% down and the down payment that
 * brings the monthly payment to the top of the healthy range.
 *
 * @param priceEur - House price.
 * @param paymentFactor - Result of `getPaymentFactor`.
 * @param savings.savedEur - Amount already saved.
 * @param savings.monthlySavingEur - Amount saved every month, no growth assumed.
 * @param savings.now - Reference date for the reach months.
 */
function buildHouseStars(
    priceEur: number,
    paymentFactor: number,
    { savedEur, monthlySavingEur, now }: SavingsInput
): HouseStar[] {
    const goals = [
        ...DOWN_PAYMENT_RATIOS.map((ratio) => {
            const percent = Math.round(ratio * 100)

            return {
                key: `down${percent}`,
                label: `${percent}% down`,
                downPaymentEur: priceEur * ratio,
            }
        }),
        {
            key: HEALTHY_STAR_KEY,
            label: 'Healthy payment',
            downPaymentEur: getDownPaymentForPayment(
                priceEur,
                HEALTHY_PAYMENT_EUR.max,
                paymentFactor
            ),
        },
    ]

    return goals.map((goal) => {
        const monthsToSave = getMonthsToSave(goal.downPaymentEur, savedEur, monthlySavingEur)

        return {
            ...goal,
            monthlyPaymentEur: (priceEur - goal.downPaymentEur) * paymentFactor,
            monthsToSave,
            reachMonth: getReachMonth(monthsToSave, now),
            progressPct: Math.min((savedEur / goal.downPaymentEur) * 100, 100),
            isEarned: monthsToSave === 0,
        }
    })
}

/**
 * A house only fits once its healthy payment star is earned, the down payment stars
 * alone just make it reachable.
 *
 * @param stars - Result of `buildHouseStars`.
 */
export function getHouseStatus(stars: HouseStar[]): HouseStatus {
    if (stars.some((star) => star.key === HEALTHY_STAR_KEY && star.isEarned)) return 'fits'
    if (stars.some((star) => star.isEarned)) return 'reachable'

    return 'locked'
}

export function buildHousePlans({
    pricesEur,
    savedEur,
    monthlySavingEur,
    loan,
    now = new Date(),
}: HousePlansInput): HousePlan[] {
    const paymentFactor = getPaymentFactor(loan)

    return pricesEur.map((priceEur) => {
        const stars = buildHouseStars(priceEur, paymentFactor, { savedEur, monthlySavingEur, now })
        const downPaymentEur = getDownPaymentForPayment(
            priceEur,
            HEALTHY_PAYMENT_EUR.min,
            paymentFactor
        )

        return {
            priceEur,
            stars,
            status: getHouseStatus(stars),
            lowestPaymentGoal: {
                downPaymentEur,
                monthsToSave: getMonthsToSave(downPaymentEur, savedEur, monthlySavingEur),
            },
        }
    })
}

/**
 * The cheapest star still to earn across every house, `null` when all are earned.
 *
 * @param plans - The house plans, cheapest house first so it wins ties.
 */
export function getNextStar(plans: HousePlan[]): NextStar | null {
    let next: NextStar | null = null

    for (const { priceEur, stars } of plans) {
        for (const star of stars) {
            if (star.isEarned) continue
            if (!next || star.downPaymentEur < next.star.downPaymentEur) next = { priceEur, star }
        }
    }

    return next
}

/**
 * The house to show: the one picked by the user, else the one holding the next star.
 *
 * @param plans - The house plans.
 * @param selectedPriceEur - Price picked by the user, `null` when none was.
 * @param nextStar - Result of `getNextStar`.
 */
export function getSelectedPlan(
    plans: HousePlan[],
    selectedPriceEur: number | null,
    nextStar: NextStar | null
): HousePlan | undefined {
    return (
        plans.find((plan) => plan.priceEur === selectedPriceEur) ??
        plans.find((plan) => plan.priceEur === nextStar?.priceEur) ??
        plans.at(0)
    )
}

/**
 * Upper bound of the payment bars, shared by every house so they stay comparable when
 * switching between them.
 *
 * @param plans - The house plans shown on the page.
 */
export function getGaugeMaxEur(plans: HousePlan[]): number {
    const payments = plans.flatMap((plan) => plan.stars.map((star) => star.monthlyPaymentEur))

    return Math.max(HEALTHY_PAYMENT_EUR.max, ...payments) * 1.1
}

export function getGaugePct(valueEur: number, gaugeMaxEur: number): number {
    return Math.min((valueEur / gaugeMaxEur) * 100, 100)
}

/**
 * Formats an estimate rounded to the nearest 100 euros, so it does not read as exact.
 *
 * @param valueEur - Amount in EUR.
 */
export function formatEstimateEur(valueEur: number): string {
    const rounded = Math.round(valueEur / ROUNDING_STEP_EUR) * ROUNDING_STEP_EUR

    return formatCurrency(rounded, Currency.EUR, 0)
}

export function formatPaymentEur(valueEur: number): string {
    return formatCurrency(Math.round(valueEur), Currency.EUR, 0)
}

export function getInitialHouseInputs(portfolioValueEur: number) {
    return {
        saved: String(Math.round(portfolioValueEur)),
        monthlySaving: String(DEFAULT_MONTHLY_SAVING_EUR),
        annualRate: String(DEFAULT_ANNUAL_RATE_PCT),
        term: String(DEFAULT_TERM_YEARS),
    }
}

export type HouseInputs = ReturnType<typeof getInitialHouseInputs>

/**
 * Describes the down payment of a star. The percentage is only added to the healthy
 * payment star, since the other labels already state it.
 *
 * @param star - The star to describe.
 * @param priceEur - Price of the house.
 */
export function getStarAmountLabel(star: HouseStar, priceEur: number): string {
    const amount = formatEstimateEur(star.downPaymentEur)

    if (star.key !== HEALTHY_STAR_KEY) return amount

    return `${amount} down (${Math.round((star.downPaymentEur / priceEur) * 100)}%)`
}

/**
 * Formats a saving time, e.g. `8 months` or `3y 2m`.
 *
 * @param months - Months left, `null` when never reached.
 */
export function formatTimeToSave(months: number | null): string {
    if (months === null) return 'Never at this rate'
    if (months === 1) return '1 month'
    if (months < MONTHS_PER_YEAR) return `${months} months`

    const years = Math.floor(months / MONTHS_PER_YEAR)
    const remainingMonths = months % MONTHS_PER_YEAR

    return remainingMonths === 0 ? `${years}y` : `${years}y ${remainingMonths}m`
}

/**
 * Compares a payment with the top of the healthy range, e.g. `173 € over your limit`.
 *
 * @param monthlyPaymentEur - Monthly payment.
 */
export function getPaymentNote(monthlyPaymentEur: number): string {
    const overEur = Math.round(monthlyPaymentEur - HEALTHY_PAYMENT_EUR.max)

    if (overEur <= 0) return 'Within your limit'

    return `${formatPaymentEur(overEur)} over your limit`
}
