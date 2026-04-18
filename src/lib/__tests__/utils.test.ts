import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cn, getBuildId, getCambioRates, getLatestUpdate, groupAssetsByType } from '@/lib/utils'
import type { TickerData } from '@/types/Transaction'
import { Currency, Ticker } from '@/types/Transaction'

// ─── cn ──────────────────────────────────────────────────────────────────────

describe('cn', () => {
    it('should merge simple class strings', () => {
        expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
    })

    it('should resolve conflicting Tailwind classes (last wins)', () => {
        expect(cn('p-2', 'p-4')).toBe('p-4')
    })

    it('should handle conditional object syntax', () => {
        expect(cn('text-xs', { 'text-success': true, 'text-destructive': false })).toBe(
            'text-xs text-success'
        )
    })

    it('should filter out falsy values', () => {
        expect(cn('base', undefined, null, false, 'active')).toBe('base active')
    })

    it('should handle arrays', () => {
        expect(cn(['flex', 'gap-2'], 'items-center')).toBe('flex gap-2 items-center')
    })

    it('should return empty string for no inputs', () => {
        expect(cn()).toBe('')
    })
})

// ─── getBuildId ──────────────────────────────────────────────────────────────

describe('getBuildId', () => {
    const originalEnv = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP

    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
    })

    afterEach(() => {
        if (originalEnv !== undefined) {
            process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = originalEnv
        } else {
            delete process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
        }
    })

    it('should return the env variable when set', () => {
        process.env.NEXT_PUBLIC_BUILD_TIMESTAMP = '20260317'
        expect(getBuildId()).toBe('20260317')
    })

    it('should fall back to "1" when env variable is not set', () => {
        expect(getBuildId()).toBe('1')
    })
})

// ─── getLatestUpdate ─────────────────────────────────────────────────────────

const baseTicker: Omit<TickerData, 'ticker' | 'last_updated_at'> = {
    curr_price: 2000,
    service: 'coinbase',
    currency: Currency.EUR,
    symbol: '€',
    logo: '/assets/ethereum.webp',
    hex_color: '#627EEA' as TickerData['hex_color'],
    type: 'CRYPTO',
}

describe('getLatestUpdate', () => {
    it('should return "—" for empty array', () => {
        expect(getLatestUpdate([])).toBe('—')
    })

    it('should return the timestamp of a single entry', () => {
        const data: TickerData[] = [
            { ...baseTicker, ticker: Ticker.ETH, last_updated_at: '2026-03-17T10:00:00' },
        ]
        expect(getLatestUpdate(data)).toBe('2026-03-17 10:00:00')
    })

    it('should return the most recent timestamp', () => {
        const data: TickerData[] = [
            { ...baseTicker, ticker: Ticker.ETH, last_updated_at: '2026-03-15 08:00:00' },
            { ...baseTicker, ticker: Ticker.SOL, last_updated_at: '2026-03-17 12:00:00' },
            { ...baseTicker, ticker: Ticker.BTC, last_updated_at: '2026-03-16 09:00:00' },
        ]
        expect(getLatestUpdate(data)).toBe('2026-03-17 12:00:00')
    })

    it('should handle entries with the same timestamp', () => {
        const data: TickerData[] = [
            { ...baseTicker, ticker: Ticker.ETH, last_updated_at: '2026-03-17 10:00:00' },
            { ...baseTicker, ticker: Ticker.SOL, last_updated_at: '2026-03-17 10:00:00' },
        ]
        expect(getLatestUpdate(data)).toBe('2026-03-17 10:00:00')
    })
})

// ─── groupAssetsByType ──────────────────────────────────────────────────────

const makeTicker = (ticker: Ticker, type: TickerData['type']): TickerData => ({
    ...baseTicker,
    ticker,
    type,
    last_updated_at: '2026-03-17 10:00:00',
})

describe('groupAssetsByType', () => {
    it('should return an empty map for an empty array', () => {
        const result = groupAssetsByType([])
        expect(result.size).toBe(0)
    })

    it('should group tickers by their asset type', () => {
        const data: TickerData[] = [
            makeTicker(Ticker.ETH, 'CRYPTO'),
            makeTicker(Ticker.VUAA, 'ETF'),
            makeTicker(Ticker.BTC, 'CRYPTO'),
            makeTicker(Ticker.ATCH, 'STOCK'),
        ]

        const result = groupAssetsByType(data)

        expect(result.size).toBe(3)
        expect(result.get('CRYPTO')?.map((t) => t.ticker)).toEqual([Ticker.ETH, Ticker.BTC])
        expect(result.get('ETF')?.map((t) => t.ticker)).toEqual([Ticker.VUAA])
        expect(result.get('STOCK')?.map((t) => t.ticker)).toEqual([Ticker.ATCH])
    })

    it('should preserve insertion order within each group', () => {
        const data: TickerData[] = [
            makeTicker(Ticker.SOL, 'CRYPTO'),
            makeTicker(Ticker.ETH, 'CRYPTO'),
            makeTicker(Ticker.BTC, 'CRYPTO'),
        ]

        const result = groupAssetsByType(data)
        expect(result.get('CRYPTO')?.map((t) => t.ticker)).toEqual([
            Ticker.SOL,
            Ticker.ETH,
            Ticker.BTC,
        ])
    })

    it('should handle a single ticker', () => {
        const data: TickerData[] = [makeTicker(Ticker.VUAA, 'ETF')]

        const result = groupAssetsByType(data)

        expect(result.size).toBe(1)
        expect(result.get('ETF')).toHaveLength(1)
        expect(result.get('ETF')![0].ticker).toBe(Ticker.VUAA)
    })
})

// ─── getCambioRates ──────────────────────────────────────────────────────

type PickTickerData = Pick<TickerData, 'ticker' | 'curr_price'>

describe('getCambioRates', () => {
    it('should return correct rates for USD and USDC', () => {
        const data: PickTickerData[] = [
            { ticker: Ticker.USD_EUR, curr_price: 0.92 },
            { ticker: Ticker.USDC_EUR, curr_price: 0.91 },
        ]

        expect(getCambioRates(data as TickerData[])).toEqual({
            usdToEur: 0.92,
            usdcToEur: 0.91,
        })
    })

    it('should return 0 when USD is missing', () => {
        const data: PickTickerData[] = [{ ticker: Ticker.USDC_EUR, curr_price: 0.91 }]

        expect(getCambioRates(data as TickerData[])).toEqual({
            usdToEur: 0,
            usdcToEur: 0.91,
        })
    })

    it('should return 0 when USDC is missing', () => {
        const data: PickTickerData[] = [{ ticker: Ticker.USD_EUR, curr_price: 0.92 }]

        expect(getCambioRates(data as TickerData[])).toEqual({
            usdToEur: 0.92,
            usdcToEur: 0,
        })
    })

    it('should return 0 for both when data is empty', () => {
        expect(getCambioRates([])).toEqual({
            usdToEur: 0,
            usdcToEur: 0,
        })
    })
})
