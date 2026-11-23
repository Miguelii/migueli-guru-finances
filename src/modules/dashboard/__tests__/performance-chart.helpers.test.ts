import { describe, it, expect } from 'vitest'
import type { PortfolioSnapshotPoint } from '@/lib/portfolio/portfolio-snapshots'
import { ValueRange } from '@/modules/dashboard/performance-chart.constants'
import { filterPointsByRange, getRangeStart } from '@/modules/dashboard/performance-chart.helpers'
import { withLiveSnapshot } from '@/modules/dashboard/dashboard.helpers'

const point = (
    date: string,
    valueEur: number,
    investedEur = 1000,
    realizedGlEur = 0
): PortfolioSnapshotPoint => ({ date, valueEur, investedEur, realizedGlEur })

describe('getRangeStart', () => {
    it('should count fixed ranges back from the latest day', () => {
        expect(getRangeStart(ValueRange.Quarter, '2026-10-12')).toBe('2026-07-12')
        expect(getRangeStart(ValueRange.Year, '2026-10-12')).toBe('2025-10-12')
    })

    it('should start YTD on January 1st and leave All unbounded', () => {
        expect(getRangeStart(ValueRange.YearToDate, '2026-10-12')).toBe('2026-01-01')
        expect(getRangeStart(ValueRange.All, '2026-10-12')).toBeNull()
    })
})

describe('filterPointsByRange', () => {
    const points = [
        point('2025-11-30', 1),
        point('2025-12-31', 2),
        point('2026-01-31', 3),
        point('2026-02-28', 4),
        point('2026-03-12', 5),
    ]

    it('should start from the last month-end before the range', () => {
        expect(filterPointsByRange(points, ValueRange.YearToDate).map((p) => p.date)).toEqual([
            '2025-12-31',
            '2026-01-31',
            '2026-02-28',
            '2026-03-12',
        ])
    })

    it('should return every point for All', () => {
        expect(filterPointsByRange(points, ValueRange.All)).toBe(points)
    })
})

describe('withLiveSnapshot', () => {
    it('should replace the stored point of the current month with the live totals', () => {
        const stored = [point('2026-09-30', 900), point('2026-10-11', 950)]

        expect(withLiveSnapshot(stored, point('2026-10-12', 1000))).toEqual([
            point('2026-09-30', 900),
            point('2026-10-12', 1000),
        ])
    })
})
