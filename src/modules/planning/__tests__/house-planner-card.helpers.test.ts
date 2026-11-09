import { describe, it, expect } from 'vitest'
import {
    buildHousePlans,
    formatEffortRate,
    formatTimeToSave,
    getGaugeMaxEur,
    getHouseStatus,
    getNextStar,
    getPaymentNote,
    getPaymentTone,
    getSelectedPlan,
} from '@/modules/planning/house-planner-card.helpers'
import {
    getAffordability,
    getAffordablePrice,
    getDownPaymentForPayment,
    getMonthsToSave,
    getPaymentFactor,
} from '@/modules/planning/house-loan.helpers'

const now = new Date(2026, 10, 8)
const loan = { annualRatePct: 4, termYears: 30 }
const factor = getPaymentFactor(loan)
const healthyDownPayment = 180_000 - 600 / factor

const plan = (savedEur: number, monthlySavingEur: number, pricesEur: number[] = [180_000]) =>
    buildHousePlans({ pricesEur, savedEur, monthlySavingEur, loan, now })

// ─── getPaymentFactor ────────────────────────────────────────────────────────

describe('getPaymentFactor', () => {
    it('should match the constant-payment formula', () => {
        expect(162_000 * factor).toBeCloseTo(773.41, 1)
    })

    it('should split the loan evenly at a 0% rate', () => {
        expect(getPaymentFactor({ annualRatePct: 0, termYears: 10 })).toBeCloseTo(1 / 120)
    })
})

// ─── getMonthsToSave ─────────────────────────────────────────────────────────

describe('getMonthsToSave', () => {
    it('should return 0 when the target is already reached', () => {
        expect(getMonthsToSave(18_000, 18_000, 1000)).toBe(0)
        expect(getMonthsToSave(18_000, 20_000, 0)).toBe(0)
    })

    it('should round up to whole months', () => {
        expect(getMonthsToSave(18_000, 10_000, 3000)).toBe(3)
    })

    it('should return null when nothing is being saved', () => {
        expect(getMonthsToSave(18_000, 10_000, 0)).toBeNull()
    })
})

// ─── getDownPaymentForPayment ────────────────────────────────────────────────

describe('getDownPaymentForPayment', () => {
    it('should leave a loan that costs exactly the payment', () => {
        const downPaymentEur = getDownPaymentForPayment(180_000, 600, factor)

        expect((180_000 - downPaymentEur) * factor).toBeCloseTo(600)
    })

    it('should never go below the minimum down payment', () => {
        expect(getDownPaymentForPayment(100_000, 2000, factor)).toBe(10_000)
    })
})

// ─── getAffordablePrice ──────────────────────────────────────────────────────

describe('getAffordablePrice', () => {
    it('should add the savings to the loan the payment supports', () => {
        expect(getAffordablePrice(60_000, 600, factor)).toBeCloseTo(60_000 + 600 / factor)
    })

    it('should be limited by the minimum down payment with little saved', () => {
        expect(getAffordablePrice(10_000, 600, factor)).toBe(100_000)
        expect(getAffordablePrice(0, 600, factor)).toBe(0)
    })
})

describe('getAffordability', () => {
    it('should add the savings of the next 24 months for the later price', () => {
        const { todayEur, laterEur } = getAffordability(60_000, 1000, factor)

        expect(todayEur).toBeCloseTo(60_000 + 600 / factor)
        expect(laterEur).toBeCloseTo(84_000 + 600 / factor)
    })
})

// ─── getPaymentTone ──────────────────────────────────────────────────────────

describe('getPaymentTone', () => {
    it('should split payments at the healthy and stretch limits', () => {
        expect(getPaymentTone(600)).toBe('healthy')
        expect(getPaymentTone(601)).toBe('stretch')
        expect(getPaymentTone(750)).toBe('stretch')
        expect(getPaymentTone(751)).toBe('heavy')
    })
})

// ─── buildHousePlans ─────────────────────────────────────────────────────────

describe('buildHousePlans', () => {
    it('should build the three stars of a house', () => {
        const [house] = plan(9000, 1000)
        const [tenPct, fifteenPct, healthy] = house!.stars

        expect(tenPct).toMatchObject({
            label: '10% down',
            downPaymentEur: 18_000,
            monthsToSave: 9,
            reachMonth: '2027-08',
            progressPct: 50,
            isEarned: false,
        })
        expect(tenPct!.monthlyPaymentEur).toBeCloseTo(162_000 * factor)
        expect(fifteenPct).toMatchObject({ label: '15% down', monthsToSave: 18 })
        expect(healthy!.label).toBe('Healthy payment')
        expect(healthy!.downPaymentEur).toBeCloseTo(healthyDownPayment)
        expect(healthy!.monthlyPaymentEur).toBeCloseTo(600)
    })

    it('should earn only the stars already saved for', () => {
        const [house] = plan(30_000, 1000)

        expect(house!.stars.map((star) => star.isEarned)).toEqual([true, true, false])
        expect(house!.stars[0]).toMatchObject({ progressPct: 100, reachMonth: '2026-11' })
    })

    it('should need more down payment for the bottom of the healthy range', () => {
        const [house] = plan(0, 1000)

        expect(house!.lowestPaymentGoal.downPaymentEur).toBeCloseTo(180_000 - 500 / factor)
        expect(house!.lowestPaymentGoal.monthsToSave).toBe(
            Math.ceil((180_000 - 500 / factor) / 1000)
        )
    })

    it('should never reach anything without savings', () => {
        const [house] = plan(0, 0)

        expect(house!.stars[0]).toMatchObject({ monthsToSave: null, reachMonth: null })
        expect(house!.lowestPaymentGoal.monthsToSave).toBeNull()
    })
})

// ─── getHouseStatus ──────────────────────────────────────────────────────────

describe('getHouseStatus', () => {
    it('should be locked without stars', () => {
        expect(getHouseStatus(plan(0, 1000)[0]!.stars)).toBe('locked')
    })

    it('should only be reachable with the down payment stars', () => {
        expect(getHouseStatus(plan(30_000, 1000)[0]!.stars)).toBe('reachable')
    })

    it('should fit once the healthy payment star is earned', () => {
        expect(getHouseStatus(plan(healthyDownPayment + 1, 1000)[0]!.stars)).toBe('fits')
    })
})

// ─── getNextStar ────────────────────────────────────────────────────────────

describe('getNextStar', () => {
    it('should pick the cheapest star across every house', () => {
        const next = getNextStar(plan(20_000, 1000, [180_000, 200_000]))

        expect(next?.priceEur).toBe(180_000)
        expect(next?.star.label).toBe('15% down')
    })

    it('should let the cheapest house win a tie', () => {
        const next = getNextStar(plan(0, 1000, [200_000, 200_000]))

        expect(next?.priceEur).toBe(200_000)
        expect(next?.star.label).toBe('10% down')
    })

    it('should return null when every star is earned', () => {
        expect(getNextStar(plan(180_000, 1000))).toBeNull()
    })
})

describe('getSelectedPlan', () => {
    const plans = plan(20_000, 1000, [180_000, 300_000])

    it('should prefer the house picked by the user', () => {
        expect(getSelectedPlan(plans, 300_000, getNextStar(plans))?.priceEur).toBe(300_000)
    })

    it('should fall back to the house of the next star', () => {
        expect(getSelectedPlan(plans, null, getNextStar(plans))?.priceEur).toBe(180_000)
        expect(getSelectedPlan(plans, 123, getNextStar(plans))?.priceEur).toBe(180_000)
    })

    it('should fall back to the first house when every star is earned', () => {
        expect(getSelectedPlan(plans, null, null)?.priceEur).toBe(180_000)
    })
})

// ─── getGaugeMaxEur ──────────────────────────────────────────────────────────

describe('getGaugeMaxEur', () => {
    it('should fit the highest payment of every house', () => {
        const plans = plan(0, 1000, [180_000, 300_000])

        expect(getGaugeMaxEur(plans)).toBeCloseTo(270_000 * factor * 1.1)
    })

    it('should always fit the healthy range', () => {
        expect(getGaugeMaxEur([])).toBeCloseTo(660)
    })
})

// ─── formatters ──────────────────────────────────────────────────────────────

describe('formatTimeToSave', () => {
    it.each([
        [null, 'Never at this rate'],
        [1, '1 month'],
        [8, '8 months'],
        [12, '1y'],
        [38, '3y 2m'],
    ])('should format %s months', (months, expected) => {
        expect(formatTimeToSave(months)).toBe(expected)
    })
})

describe('formatEffortRate', () => {
    it('should divide the payment by the net salary', () => {
        expect(formatEffortRate(600, 2100)).toBe('29%')
        expect(formatEffortRate(1050, 2100)).toBe('50%')
        expect(formatEffortRate(600, 1500)).toBe('40%')
    })
})

describe('getPaymentNote', () => {
    it('should only mention the amount above the limit', () => {
        expect(getPaymentNote(600)).toBe('Within your limit')
        expect(getPaymentNote(600.2)).toBe('Within your limit')
        expect(getPaymentNote(773)).toContain('173')
    })
})
