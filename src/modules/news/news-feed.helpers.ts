import { NEWS_TIME_ZONE } from '@/lib/constants/news'
import { addDaysToDateKey, toDateKey } from '@/lib/portfolio/portfolio-snapshots'
import type { NewsItem } from '@/types/News'
import { NEWS_DAY_LABEL } from '@/modules/news/news-feed.constants'

export type NewsDayGroup = {
    /** Day key in `YYYY-MM-DD` format */
    day: string
    label: string
    items: NewsItem[]
}

/**
 * Formats a day key as a heading: `Today`, `Yesterday` or the date (`10 de outubro`).
 *
 * @param day - Day key in `YYYY-MM-DD` format.
 * @param today - Today's day key.
 */
function formatDayLabel(day: string, today: string): string {
    if (day === today) return NEWS_DAY_LABEL.today
    if (day === addDaysToDateKey(today, -1)) return NEWS_DAY_LABEL.yesterday

    const [year, month, date] = day.split('-').map(Number)
    return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1)).toLocaleDateString('pt-PT', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'long',
        year: day.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric',
    })
}

/**
 * Groups feed items (newest first) by their day in the app time zone.
 *
 * @param news - Feed items, newest first.
 * @param now - Reference instant for the "Today" / "Yesterday" labels.
 */
export function groupNewsByDay(news: NewsItem[], now: Date): NewsDayGroup[] {
    const today = toDateKey(now, NEWS_TIME_ZONE)
    const groups: NewsDayGroup[] = []

    for (const item of news) {
        const day = toDateKey(new Date(item.publishedAt), NEWS_TIME_ZONE)
        const last = groups.at(-1)

        if (last?.day === day) last.items.push(item)
        else groups.push({ day, label: formatDayLabel(day, today), items: [item] })
    }

    return groups
}

/**
 * Formats the publication time of an item (`14:30`) in the app time zone.
 *
 * @param publishedAt - ISO timestamp.
 */
export function formatNewsTime(publishedAt: string): string {
    return new Date(publishedAt).toLocaleTimeString('pt-PT', {
        timeZone: NEWS_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
    })
}
