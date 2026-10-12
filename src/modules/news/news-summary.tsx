import { CalendarClockIcon, NewspaperIcon, RadarIcon } from 'lucide-react'
import { AssetLogo } from '@/components/ui/asset-logo'
import type { PortfolioEvent } from '@/types/News'
import type { TickerData } from '@/types/Transaction'
import { cn } from '@/lib/utils'
import { EVENT_TYPE_LABEL } from '@/modules/news/events-calendar.constants'
import { SUMMARY_TILE_CLASS } from '@/modules/news/news-summary.constants'
import { formatCountdown, formatEventDay } from '@/modules/news/events-calendar.helpers'

type Props = {
    nextEvent: PortfolioEvent | undefined
    recentCount: number
    followedCount: number
    keywordCount: number
    logos: Map<string, TickerData['logo']>
    today: string
    onSelectEvent: (date: string) => void
}

type TileProps = {
    label: string
    icon: React.ReactNode
    children: React.ReactNode
}

const Tile = ({ label, icon, children }: TileProps) => (
    <>
        <span className="flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
            {icon}
        </span>
        {children}
    </>
)

export function NewsSummary({
    nextEvent,
    recentCount,
    followedCount,
    keywordCount,
    logos,
    today,
    onSelectEvent,
}: Props) {
    const nextEventTile = (
        <Tile label="Next event" icon={<CalendarClockIcon aria-hidden="true" className="size-4" />}>
            {nextEvent ? (
                <span className="flex items-center gap-2.5">
                    <AssetLogo
                        logo={logos.get(nextEvent.ticker)}
                        ticker={nextEvent.ticker}
                        className="size-8"
                    />
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold">
                            {nextEvent.ticker} · {EVENT_TYPE_LABEL[nextEvent.type]}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {formatEventDay(nextEvent.date, true)} ·{' '}
                            {formatCountdown(nextEvent.date, today)}
                        </span>
                    </span>
                </span>
            ) : (
                <span className="text-sm text-muted-foreground">No upcoming events</span>
            )}
        </Tile>
    )

    return (
        <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
            {nextEvent ? (
                <button
                    type="button"
                    onClick={() => onSelectEvent(nextEvent.date)}
                    className={cn(
                        SUMMARY_TILE_CLASS,
                        'cursor-pointer transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none'
                    )}
                >
                    {nextEventTile}
                </button>
            ) : (
                <div className={SUMMARY_TILE_CLASS}>{nextEventTile}</div>
            )}

            <div className={SUMMARY_TILE_CLASS}>
                <Tile
                    label="This week"
                    icon={<NewspaperIcon aria-hidden="true" className="size-4" />}
                >
                    <span className="text-2xl font-semibold tabular-nums">{recentCount}</span>
                    <span className="text-xs text-muted-foreground">
                        {recentCount === 1 ? 'story' : 'stories'} in the last 7 days
                    </span>
                </Tile>
            </div>

            <div className={SUMMARY_TILE_CLASS}>
                <Tile label="Following" icon={<RadarIcon aria-hidden="true" className="size-4" />}>
                    <span className="text-2xl font-semibold tabular-nums">{followedCount}</span>
                    <span className="text-xs text-muted-foreground">
                        {followedCount === 1 ? 'asset' : 'assets'}
                        {keywordCount > 0 && ` · ${keywordCount} with search terms`}
                    </span>
                </Tile>
            </div>
        </section>
    )
}
