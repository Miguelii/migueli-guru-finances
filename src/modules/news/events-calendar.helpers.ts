import type { PortfolioEvent } from '@/types/News'

export type CalendarMonth = {
    year: number
    /** 0-based month (January is 0) */
    month: number
}

export type CalendarCell = {
    /** Day key in `YYYY-MM-DD` format */
    date: string
    day: number
    inMonth: boolean
}

const DAY_MS = 86_400_000

/**
 * Parses a `YYYY-MM-DD` day key into its calendar month.
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 */
export function toCalendarMonth(dateKey: string): CalendarMonth {
    const [year, month] = dateKey.split('-').map(Number)
    return { year: year ?? 0, month: (month ?? 1) - 1 }
}

/**
 * Moves a calendar month forward or back, rolling over the year.
 *
 * @param current - The month shown.
 * @param delta - Months to move (negative goes back).
 */
export function shiftMonth(current: CalendarMonth, delta: number): CalendarMonth {
    const date = new Date(Date.UTC(current.year, current.month + delta, 1))
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

/**
 * Builds the cells of a month view starting on Monday: the days of the month plus the
 * days of the neighbouring months that complete the first and last weeks.
 *
 * @param current - The month to lay out.
 */
export function buildMonthGrid(current: CalendarMonth): CalendarCell[] {
    const first = Date.UTC(current.year, current.month, 1)
    const daysInMonth = new Date(Date.UTC(current.year, current.month + 1, 0)).getUTCDate()
    const leading = (new Date(first).getUTCDay() + 6) % 7
    const total = Math.ceil((leading + daysInMonth) / 7) * 7

    return Array.from({ length: total }, (_, index) => {
        const date = new Date(first + (index - leading) * DAY_MS)

        return {
            date: date.toISOString().slice(0, 10),
            day: date.getUTCDate(),
            inMonth: date.getUTCMonth() === current.month,
        }
    })
}

/**
 * Indexes events by their day.
 *
 * @param events - Events in any order.
 */
export function groupEventsByDay(events: PortfolioEvent[]): Map<string, PortfolioEvent[]> {
    return Map.groupBy(events, (event) => event.date)
}

/**
 * Events from today on, soonest first.
 *
 * @param events - Events in any order.
 * @param today - Today's day key.
 * @param limit - Maximum number of events.
 */
export function getUpcomingEvents(
    events: PortfolioEvent[],
    today: string,
    limit: number
): PortfolioEvent[] {
    return events
        .filter((event) => event.date >= today)
        .toSorted((a, b) => a.date.localeCompare(b.date))
        .slice(0, limit)
}

/**
 * Formats a calendar month as a title (`outubro de 2026`).
 *
 * @param current - The month shown.
 */
export function formatMonthTitle(current: CalendarMonth): string {
    return new Date(Date.UTC(current.year, current.month, 1)).toLocaleDateString('pt-PT', {
        timeZone: 'UTC',
        month: 'long',
        year: 'numeric',
    })
}

/**
 * Formats an event day (`28 out.`), with the weekday when asked (`ter., 28 out.`).
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 * @param withWeekday - When true, prefixes the short weekday.
 */
export function formatEventDay(dateKey: string, withWeekday = false): string {
    const { year, month } = toCalendarMonth(dateKey)
    const day = Number(dateKey.slice(8, 10))

    return new Date(Date.UTC(year, month, day)).toLocaleDateString('pt-PT', {
        timeZone: 'UTC',
        weekday: withWeekday ? 'short' : undefined,
        day: 'numeric',
        month: 'short',
    })
}

/**
 * UTC midnight of a `YYYY-MM-DD` day key, in milliseconds.
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 */
function toUtcTime(dateKey: string): number {
    const [year, month, day] = dateKey.split('-').map(Number)
    return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

/**
 * Days from `today` to `dateKey` (negative in the past).
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 * @param today - Today's day key.
 */
function daysUntil(dateKey: string, today: string): number {
    return Math.round((toUtcTime(dateKey) - toUtcTime(today)) / DAY_MS)
}

/**
 * Countdown label of an event: `Today`, `Tomorrow`, `In 16 days` or `3 days ago`.
 *
 * @param dateKey - Day key of the event.
 * @param today - Today's day key.
 */
export function formatCountdown(dateKey: string, today: string): string {
    const days = daysUntil(dateKey, today)

    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days > 1) return `In ${days} days`
    if (days === -1) return 'Yesterday'
    return `${-days} days ago`
}

/**
 * Formats a day key as the heading of the selected day (`terça-feira, 28 de outubro`).
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 */
export function formatSelectedDay(dateKey: string): string {
    const { year, month } = toCalendarMonth(dateKey)

    return new Date(Date.UTC(year, month, Number(dateKey.slice(8, 10)))).toLocaleDateString(
        'pt-PT',
        { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }
    )
}

/**
 * Short month of a day key for the date blocks (`out.`).
 *
 * @param dateKey - Day key in `YYYY-MM-DD` format.
 */
export function formatShortMonth(dateKey: string): string {
    const { year, month } = toCalendarMonth(dateKey)

    return new Date(Date.UTC(year, month, 1)).toLocaleDateString('pt-PT', {
        timeZone: 'UTC',
        month: 'short',
    })
}

/**
 * Screen reader label of a day cell (`ter., 28 out., 2 events`).
 *
 * @param dateKey - Day key of the cell.
 * @param eventCount - Events on that day.
 */
export function getDayAriaLabel(dateKey: string, eventCount: number): string {
    const day = formatEventDay(dateKey, true)
    if (eventCount === 0) return day
    return `${day}, ${eventCount} ${eventCount === 1 ? 'event' : 'events'}`
}
