import { describe, it, expect } from 'vitest'
import {
    buildAssetAllocation,
    buildTypeAllocation,
} from '@/modules/allocation-chart/allocation-card-with-chart.helpers'
import { Ticker, TickerType } from '@/types/Transaction'
import type { HoldingSummary } from '@/types/Holding'

const holding = (
    symbol: Ticker,
    tickerType: TickerType,
    current_value_eur: number,
    tickerHexColor?: string
) =>
    ({
        symbol,
        tickerType,
        current_value_eur,
        total_invested_eur: 0,
        realized_gl_eur: 0,
        tickerHexColor,
    }) as HoldingSummary

describe('buildAssetAllocation', () => {
    it('should sort by current value and skip closed positions', () => {
        const result = buildAssetAllocation([
            holding(Ticker.ETH, TickerType.Crypto, 100, '#111111'),
            holding(Ticker.BTC, TickerType.Crypto, 0),
            holding(Ticker.VUAA, TickerType.Etf, 300),
        ])

        expect(result.map((d) => d.name)).toEqual([Ticker.VUAA, Ticker.ETH])
        expect(result[0]!.percentage).toBeCloseTo(75)
        expect(result[0]!.fill).toBe('var(--color-muted-foreground)')
        expect(result[1]!.fill).toBe('#111111')
    })
})

describe('buildTypeAllocation', () => {
    it('should label and color each asset type', () => {
        const result = buildTypeAllocation([
            holding(Ticker.ETH, TickerType.Crypto, 100),
            holding(Ticker.VUAA, TickerType.Etf, 300),
        ])

        expect(result).toEqual([
            { name: 'ETFs', value: 300, percentage: 75, fill: 'var(--color-asset-etf)' },
            { name: 'Crypto', value: 100, percentage: 25, fill: 'var(--color-asset-crypto)' },
        ])
    })
})
