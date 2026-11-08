import { describe, it, expect } from 'vitest'
import {
    buildProjection,
    buildScenarios,
    getMilestones,
    getYearOpening,
    resolveProjectionRate,
} from '@/modules/planning/planning-card.helpers'

const now = new Date(2026, 9, 13)

const snapshot = (date: string, valueEur: number) => ({
    date,
    valueEur,
    investedEur: 0,
    realizedGlEur: 0,
})

// ─── getYearOpening ──────────────────────────────────────────────────────────

describe('getYearOpening', () => {
    it('should pick the last snapshot of the previous year', () => {
        const snapshots = [
            snapshot('2025-11-30', 900),
            snapshot('2025-12-31', 1000),
            snapshot('2026-01-31', 1100),
        ]

        expect(getYearOpening(snapshots, now)).toEqual({ date: '2025-12-31', valueEur: 1000 })
    })

    it('should return undefined when every snapshot is from this year', () => {
        expect(getYearOpening([snapshot('2026-01-31', 1100)], now)).toBeUndefined()
        expect(getYearOpening([], now)).toBeUndefined()
    })
})

// ─── resolveProjectionRate ───────────────────────────────────────────────────

describe('resolveProjectionRate', () => {
    it('should assume 0% without an annualized return', () => {
        expect(resolveProjectionRate(null)).toEqual({ rate: 0, since: null, isCapped: false })
    })

    it('should keep a rate inside the bounds', () => {
        expect(resolveProjectionRate({ rate: 0.1, since: '2024-03-01' })).toEqual({
            rate: 0.1,
            since: '2024-03-01',
            isCapped: false,
        })
    })

    it('should cap rates outside the bounds', () => {
        expect(resolveProjectionRate({ rate: 0.9, since: '2024-03-01' })).toMatchObject({
            rate: 0.3,
            isCapped: true,
        })
        expect(resolveProjectionRate({ rate: -0.6, since: '2024-03-01' })).toMatchObject({
            rate: -0.3,
            isCapped: true,
        })
    })
})

// ─── buildProjection ─────────────────────────────────────────────────────────

describe('buildProjection', () => {
    it('should start today and add one point per month', () => {
        const points = buildProjection({
            startValueEur: 10000,
            startInvestedEur: 8000,
            monthlyContributionEur: 1000,
            annualRate: 0,
            months: 24,
            now,
        })

        expect(points).toHaveLength(25)
        expect(points[0]).toEqual({ month: '2026-10', valueEur: 10000, investedEur: 8000 })
        expect(points.at(-1)?.month).toBe('2028-10')
    })

    it('should only add the contributions at a 0% rate', () => {
        const points = buildProjection({
            startValueEur: 10000,
            startInvestedEur: 8000,
            monthlyContributionEur: 1000,
            annualRate: 0,
            months: 24,
            now,
        })

        expect(points[12]?.valueEur).toBeCloseTo(22000)
        expect(points[24]?.investedEur).toBe(32000)
    })

    it('should compound the yearly rate monthly', () => {
        const points = buildProjection({
            startValueEur: 1000,
            startInvestedEur: 1000,
            monthlyContributionEur: 0,
            annualRate: 0.1,
            months: 24,
            now,
        })

        expect(points[12]?.valueEur).toBeCloseTo(1100)
        expect(points[24]?.valueEur).toBeCloseTo(1210)
    })

    it('should grow each contribution from the month it is added', () => {
        const points = buildProjection({
            startValueEur: 0,
            startInvestedEur: 0,
            monthlyContributionEur: 1000,
            annualRate: 0.1,
            months: 1,
            now,
        })

        expect(points[1]?.valueEur).toBeCloseTo(1000 * 1.1 ** (1 / 12))
    })
})

// ─── getMilestones ───────────────────────────────────────────────────────────

describe('getMilestones', () => {
    it('should return an empty array without points', () => {
        expect(getMilestones([])).toEqual([])
    })

    it('should split the change since today into deposits and growth', () => {
        const points = buildProjection({
            startValueEur: 10000,
            startInvestedEur: 8000,
            monthlyContributionEur: 1000,
            annualRate: 0.1,
            months: 24,
            now,
        })
        const milestones = getMilestones(points)

        expect(milestones.map((m) => m.offset)).toEqual([0, 12, 24])
        expect(milestones.map((m) => m.depositsEur)).toEqual([0, 12000, 24000])
        expect(milestones[0]).toMatchObject({ growthEur: 0, changePct: 0 })

        const inOneYear = milestones[1]!
        expect(inOneYear.growthEur).toBeCloseTo(inOneYear.valueEur - 10000 - 12000)
        expect(inOneYear.growthEur).toBeGreaterThan(1000)
        expect(inOneYear.changePct).toBeCloseTo((inOneYear.valueEur / 10000 - 1) * 100)
    })
})

// ─── buildScenarios ──────────────────────────────────────────────────────────

describe('buildScenarios', () => {
    const input = { startValueEur: 10000, startInvestedEur: 8000, annualRate: 0, months: 24, now }

    it('should build one projection per monthly amount', () => {
        const scenarios = buildScenarios(input)

        expect(scenarios.map((s) => s.monthlyContributionEur)).toEqual([1000, 1250, 1500, 1800])
        expect(scenarios.map((s) => s.key)).toEqual([
            'contribution1000',
            'contribution1250',
            'contribution1500',
            'contribution1800',
        ])
        expect(scenarios.map((s) => s.points.at(-1)?.investedEur)).toEqual([
            32000, 38000, 44000, 51200,
        ])
    })

    it('should compare each milestone with the first scenario', () => {
        const scenarios = buildScenarios(input)
        const differences = scenarios.map((s) => s.milestones.map((m) => m.differenceEur))

        expect(differences).toEqual([
            [0, 0, 0],
            [0, 3000, 6000],
            [0, 6000, 12000],
            [0, 9600, 19200],
        ])
    })
})
