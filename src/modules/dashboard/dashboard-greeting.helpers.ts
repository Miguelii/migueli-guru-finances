import { SNAPSHOT_TIME_ZONE } from '@/lib/constants/portfolio-snapshots'

/**
 * Greeting for the time of day in the portfolio time zone (the server runs in UTC).
 *
 * @param date - The current instant.
 */
export function getGreeting(date: Date): string {
    const hour = Number(
        new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric',
            hourCycle: 'h23',
            timeZone: SNAPSHOT_TIME_ZONE,
        }).format(date)
    )

    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 19) return 'Good afternoon'
    return 'Good evening'
}

/**
 * First word of the user's display name, or `null` without one.
 *
 * @param name - Full display name.
 */
export function getFirstName(name: string | null): string | null {
    return name?.split(/\s+/u).at(0) ?? null
}
