import { describe, it, expect } from 'vitest'
import { buildScenarios } from '@/modules/planning/planning-card.helpers'
import {
    getScenarioChartConfig,
    toScenarioChartRows,
} from '@/modules/planning/projection-chart.helpers'

const scenarios = buildScenarios({
    startValueEur: 10000,
    startInvestedEur: 8000,
    annualRate: 0,
    months: 2,
    now: new Date(2026, 9, 13),
})

describe('toScenarioChartRows', () => {
    it('should put every scenario value of a month in the same row', () => {
        expect(toScenarioChartRows(scenarios)).toEqual([
            {
                month: '2026-10',
                contribution1000: 10000,
                contribution1250: 10000,
                contribution1500: 10000,
                contribution1800: 10000,
            },
            {
                month: '2026-11',
                contribution1000: 11000,
                contribution1250: 11250,
                contribution1500: 11500,
                contribution1800: 11800,
            },
            {
                month: '2026-12',
                contribution1000: 12000,
                contribution1250: 12500,
                contribution1500: 13000,
                contribution1800: 13600,
            },
        ])
    })

    it('should return no rows without scenarios', () => {
        expect(toScenarioChartRows([])).toEqual([])
    })
})

describe('getScenarioChartConfig', () => {
    it('should key each scenario color and label by its data key', () => {
        const config = getScenarioChartConfig(scenarios)

        expect(Object.keys(config)).toEqual([
            'contribution1000',
            'contribution1250',
            'contribution1500',
            'contribution1800',
        ])
        expect(config.contribution1250?.color).toBe('var(--color-chart-2)')
        expect(config.contribution1250?.label).toContain('/ month')
    })
})
