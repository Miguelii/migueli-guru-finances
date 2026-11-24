import { describe, expect, it } from 'vitest'
import type { FifoLot, FifoSell, FifoSellLot } from '@/lib/portfolio/fifo-ledger'
import { TransactionType, type Transaction } from '@/types/Transaction'
import { buildFifoTrail } from '@/modules/transactions/transaction-fifo-trail.helpers'
import {
    formatHoldingPeriod,
    formatSignedEur,
    formatSoldShare,
    getSoldShare,
} from '@/modules/transactions/transaction-fifo-details.helpers'

const LOT_DATES: Transaction['buy_date'][] = [
    '2025-01-01 10:00:00',
    '2025-02-01 10:00:00',
    '2025-03-01 10:00:00',
    '2025-04-01 10:00:00',
    '2025-05-01 10:00:00',
]

const sellLot = (index: number): FifoSellLot => ({
    lotId: `buy-${index}`,
    lotType: TransactionType.Buy,
    acquiredAt: LOT_DATES[index - 1]!,
    quantity: 1,
    costEur: 100,
    gainEur: 50,
    taxRate: 0,
})

const sell = (lotCount: number): FifoSell => ({
    lots: Array.from({ length: lotCount }, (_, index) => sellLot(index + 1)),
    costEur: 100 * lotCount,
    gainEur: 50 * lotCount,
    unmatchedQuantity: 0,
    taxRates: [0],
})

const lot: FifoLot = {
    acquiredQuantity: 1.0012,
    soldQuantity: 1,
    remainingQuantity: 0.0012,
    isClosed: false,
    sales: [
        {
            sellId: 'sell',
            soldAt: '2026-10-30 00:02:00',
            quantity: 1,
            gainEur: 350,
            taxRate: 0,
        },
    ],
}

describe('buildFifoTrail', () => {
    it('should be null without links', () => {
        expect(buildFifoTrail()).toBeNull()
        expect(buildFifoTrail(sell(0))).toBeNull()
    })

    it('should link a sell to its lots and cap the inline links', () => {
        const trail = buildFifoTrail(sell(5), undefined, 3)!

        expect(trail.kind).toBe('sell')
        expect(trail.links.map((link) => link.targetId)).toEqual(['buy-1', 'buy-2', 'buy-3'])
        expect(trail.hiddenCount).toBe(2)
        expect(trail.remainingQuantity).toBe(0)
    })

    it('should link a lot to its sales with the quantity still open', () => {
        const trail = buildFifoTrail(undefined, lot)!

        expect(trail).toEqual({
            kind: 'lot',
            links: [
                {
                    targetId: 'sell',
                    targetType: TransactionType.Sell,
                    date: '2026-10-30 00:02:00',
                    quantity: 1,
                    taxRate: 0,
                },
            ],
            hiddenCount: 0,
            remainingQuantity: 0.0012,
        })
    })
})

describe('FIFO details helpers', () => {
    it('should format the holding period between buy and sell', () => {
        expect(formatHoldingPeriod('2025-02-06 00:00:00', '2026-10-30 00:02:00')).toBe(
            '1 year, 8 months'
        )
    })

    it('should sign gains', () => {
        expect(formatSignedEur(353.04)).toMatch(/^\+353,04/u)
        expect(formatSignedEur(-12.1)).toMatch(/^-12,10/u)
    })

    it('should never round an open lot up to fully sold', () => {
        expect(formatSoldShare(getSoldShare(lot))).toBe('99,9%')
        expect(getSoldShare({ ...lot, isClosed: true })).toBe(1)
    })
})
