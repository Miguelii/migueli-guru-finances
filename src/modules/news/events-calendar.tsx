'use client'

import { ChevronLeftIcon, ChevronRightIcon, NewspaperIcon } from 'lucide-react'
import { AssetLogo } from '@/components/ui/asset-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PortfolioEvent } from '@/types/News'
import type { TickerData } from '@/types/Transaction'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import {
    EVENT_TYPE_BADGE_VARIANT,
    EVENT_TYPE_DOT_CLASS,
    EVENT_TYPE_LABEL,
    EVENT_TYPES,
    MAX_DOTS_PER_DAY,
    UPCOMING_EVENTS_LIMIT,
    WEEKDAY_LABELS,
} from '@/modules/news/events-calendar.constants'
import {
    type CalendarMonth,
    buildMonthGrid,
    formatCountdown,
    formatMonthTitle,
    formatSelectedDay,
    formatShortMonth,
    getDayAriaLabel,
    getUpcomingEvents,
    groupEventsByDay,
    shiftMonth,
} from '@/modules/news/events-calendar.helpers'

type Props = Readonly<{
    events: PortfolioEvent[]
    logos: Map<string, TickerData['logo']>
    today: string
    month: CalendarMonth
    selectedDay: string
    onMonthChange: (month: CalendarMonth) => void
    onSelectDay: (date: string) => void
    onGoToDay: (date: string) => void
    onShowNews: (ticker: string) => void
}>

type EventRowProps = Readonly<{
    event: PortfolioEvent
    logo: TickerData['logo']
    onShowNews: (ticker: string) => void
}>

const EventRow = ({ event, logo, onShowNews }: EventRowProps) => (
    <li className="flex items-center gap-3 py-2.5">
        <AssetLogo logo={logo} ticker={event.ticker} className="size-7" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium">{event.ticker}</span>
            <span className="flex flex-wrap items-center gap-1.5">
                <Badge variant={EVENT_TYPE_BADGE_VARIANT[event.type]}>
                    {EVENT_TYPE_LABEL[event.type]}
                </Badge>
                {event.isEstimate && (
                    <span className="text-xs text-muted-foreground">Estimated date</span>
                )}
            </span>
        </div>
        <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowNews(event.ticker)}
            className="h-9 cursor-pointer gap-1.5 rounded-none text-xs"
            aria-label={`Show ${event.ticker} news`}
        >
            <NewspaperIcon aria-hidden="true" className="size-3.5" />
            News
        </Button>
    </li>
)

export function EventsCalendar({
    events,
    logos,
    today,
    month,
    selectedDay,
    onMonthChange,
    onSelectDay,
    onGoToDay,
    onShowNews,
}: Props) {
    const eventsByDay = groupEventsByDay(events)
    const selectedEvents = eventsByDay.get(selectedDay) ?? []
    const upcoming = getUpcomingEvents(events, today, UPCOMING_EVENTS_LIMIT)

    return (
        <PortfolioCard
            cardId="events-calendar"
            title="Calendar"
            className="min-w-0"
            openHeightClassName="h-auto"
            contentClassName="flex w-full min-w-0 flex-col gap-5"
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <p
                        className="text-base font-semibold first-letter:uppercase"
                        aria-live="polite"
                    >
                        {formatMonthTitle(month)}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 cursor-pointer rounded-none"
                            aria-label="Previous month"
                            onClick={() => onMonthChange(shiftMonth(month, -1))}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 cursor-pointer rounded-none text-xs"
                            onClick={() => onGoToDay(today)}
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 cursor-pointer rounded-none"
                            aria-label="Next month"
                            onClick={() => onMonthChange(shiftMonth(month, 1))}
                        >
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_LABELS.map((label) => (
                        <span
                            key={label}
                            aria-hidden="true"
                            className="py-1 text-xs font-medium text-muted-foreground"
                        >
                            {label}
                        </span>
                    ))}
                    {buildMonthGrid(month).map((cell) => {
                        const dayEvents = eventsByDay.get(cell.date) ?? []
                        const isSelected = cell.date === selectedDay
                        const isToday = cell.date === today

                        return (
                            <button
                                key={cell.date}
                                type="button"
                                aria-pressed={isSelected}
                                aria-current={isToday ? 'date' : undefined}
                                aria-label={getDayAriaLabel(cell.date, dayEvents.length)}
                                onClick={() => onSelectDay(cell.date)}
                                className={cn(
                                    'flex aspect-square min-h-9 cursor-pointer flex-col items-center justify-center gap-1 text-sm tabular-nums transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
                                    {
                                        'text-muted-foreground/50': !cell.inMonth && !isSelected,
                                        'font-semibold': dayEvents.length > 0 || isToday,
                                        'ring-1 ring-foreground/40': isToday && !isSelected,
                                        'bg-primary text-primary-foreground': isSelected,
                                        'hover:bg-muted': !isSelected,
                                    }
                                )}
                            >
                                <span>{cell.day}</span>
                                <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                                    {dayEvents.slice(0, MAX_DOTS_PER_DAY).map((event) => (
                                        <span
                                            key={event.id}
                                            className={cn(
                                                'size-1.5 rounded-full',
                                                EVENT_TYPE_DOT_CLASS[event.type]
                                            )}
                                        />
                                    ))}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {EVENT_TYPES.map((type) => (
                        <li
                            key={type}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                            <span
                                aria-hidden="true"
                                className={cn('size-2 rounded-full', EVENT_TYPE_DOT_CLASS[type])}
                            />
                            {EVENT_TYPE_LABEL[type]}
                        </li>
                    ))}
                </ul>
            </div>

            <section aria-labelledby="selected-day-title" className="flex flex-col border-t pt-4">
                <h3
                    id="selected-day-title"
                    className="text-sm font-semibold first-letter:uppercase"
                    aria-live="polite"
                >
                    {formatSelectedDay(selectedDay)}
                </h3>
                {selectedEvents.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">No events on this day.</p>
                ) : (
                    <ul className="flex flex-col divide-y">
                        {selectedEvents.map((event) => (
                            <EventRow
                                key={event.id}
                                event={event}
                                logo={logos.get(event.ticker)}
                                onShowNews={onShowNews}
                            />
                        ))}
                    </ul>
                )}
            </section>

            <section aria-labelledby="upcoming-title" className="flex flex-col gap-2 border-t pt-4">
                <h3
                    id="upcoming-title"
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                    Upcoming
                </h3>
                {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No upcoming events. Earnings and dividend dates are only available for
                        stocks.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {upcoming.map((event) => (
                            <li key={event.id}>
                                <button
                                    type="button"
                                    onClick={() => onGoToDay(event.date)}
                                    className={cn(
                                        'flex w-full cursor-pointer items-center gap-3 p-2 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
                                        {
                                            'bg-muted': event.date === selectedDay,
                                            'hover:bg-muted/60': event.date !== selectedDay,
                                        }
                                    )}
                                >
                                    <span className="flex w-11 shrink-0 flex-col items-center border bg-card py-1">
                                        <span className="text-base leading-none font-semibold tabular-nums">
                                            {Number(event.date.slice(8, 10))}
                                        </span>
                                        <span className="text-xs text-muted-foreground uppercase">
                                            {formatShortMonth(event.date)}
                                        </span>
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="flex items-center gap-2 text-sm font-medium">
                                            <AssetLogo
                                                logo={logos.get(event.ticker)}
                                                ticker={event.ticker}
                                                className="size-4"
                                            />
                                            {event.ticker}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'size-2 rounded-full',
                                                    EVENT_TYPE_DOT_CLASS[event.type]
                                                )}
                                            />
                                            {EVENT_TYPE_LABEL[event.type]}
                                            {event.isEstimate && ' (est.)'}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-xs font-medium tabular-nums">
                                        {formatCountdown(event.date, today)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </PortfolioCard>
    )
}
