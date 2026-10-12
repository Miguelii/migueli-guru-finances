import { describe, it, expect } from 'vitest'
import {
    buildMonthGrid,
    formatCountdown,
    getDayAriaLabel,
    getUpcomingEvents,
    groupEventsByDay,
    shiftMonth,
} from '@/modules/news/events-calendar.helpers'
import { PortfolioEventType, type PortfolioEvent } from '@/types/News'
import { Ticker } from '@/types/Transaction'

const event = (date: string, ticker = Ticker.ATCH): PortfolioEvent => ({
    id: `${ticker}:${date}`,
    ticker,
    type: PortfolioEventType.Earnings,
    date,
    isEstimate: false,
})

describe('buildMonthGrid', () => {
    it('should start on Monday and complete the last week', () => {
        // October 2026 starts on a Thursday and ends on a Saturday
        const cells = buildMonthGrid({ year: 2026, month: 9 })

        expect(cells).toHaveLength(35)
        expect(cells[0]).toEqual({ date: '2026-09-28', day: 28, inMonth: false })
        expect(cells[3]).toEqual({ date: '2026-10-01', day: 1, inMonth: true })
        expect(cells.at(-1)).toEqual({ date: '2026-11-01', day: 1, inMonth: false })
    })
})

describe('shiftMonth', () => {
    it('should roll over the year', () => {
        expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
        expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
    })
})

describe('groupEventsByDay', () => {
    it('should index the events by day', () => {
        const grouped = groupEventsByDay([event('2026-10-28'), event('2026-10-28', Ticker.VUAA)])

        expect(grouped.get('2026-10-28')).toHaveLength(2)
    })
})

describe('getUpcomingEvents', () => {
    it('should keep today and later, soonest first, up to the limit', () => {
        const events = [
            event('2026-11-04'),
            event('2026-10-01'),
            event('2026-10-12'),
            event('2026-12-01'),
        ]

        expect(getUpcomingEvents(events, '2026-10-12', 2).map((e) => e.date)).toEqual([
            '2026-10-12',
            '2026-11-04',
        ])
    })
})

describe('formatCountdown', () => {
    it('should describe the distance to the event in days', () => {
        expect(formatCountdown('2026-10-12', '2026-10-12')).toBe('Today')
        expect(formatCountdown('2026-10-13', '2026-10-12')).toBe('Tomorrow')
        expect(formatCountdown('2026-10-28', '2026-10-12')).toBe('In 16 days')
        expect(formatCountdown('2026-10-09', '2026-10-12')).toBe('3 days ago')
    })
})

describe('getDayAriaLabel', () => {
    it('should add the event count only when there are events', () => {
        expect(getDayAriaLabel('2026-10-28', 0)).not.toContain('event')
        expect(getDayAriaLabel('2026-10-28', 1)).toMatch(/, 1 event$/u)
        expect(getDayAriaLabel('2026-10-28', 2)).toMatch(/, 2 events$/u)
    })
})
