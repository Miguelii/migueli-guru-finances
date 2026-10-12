'use client'

import type { NewsItem, PortfolioEvent } from '@/types/News'
import type { TickerData } from '@/types/Transaction'
import { EventsCalendar } from '@/modules/news/events-calendar'
import { NewsAssetFilter } from '@/modules/news/news-asset-filter'
import { NewsFeed } from '@/modules/news/news-feed'
import { NewsSummary } from '@/modules/news/news-summary'
import { RECENT_NEWS_DAYS } from '@/modules/news/news-explorer.constants'
import { countRecentNews } from '@/modules/news/news-explorer.helpers'
import { useNewsExplorer } from '@/modules/news/use-news-explorer'

type Props = {
    news: NewsItem[]
    events: PortfolioEvent[]
    assets: TickerData[]
    /** Today's day key, computed on the server so both renders agree */
    today: string
}

export function NewsExplorer({ news, events, assets, today }: Props) {
    const {
        filterOptions,
        selectedAsset,
        visibleNews,
        visibleEvents,
        nextEvent,
        selectedDay,
        month,
        logos,
        changeAsset,
        changeMonth,
        selectDay,
        goToDay,
    } = useNewsExplorer({ news, events, assets, today })

    return (
        <>
            <NewsSummary
                nextEvent={nextEvent}
                recentCount={countRecentNews(visibleNews, new Date(), RECENT_NEWS_DAYS)}
                followedCount={assets.length}
                keywordCount={assets.filter((asset) => asset.news_keywords).length}
                logos={logos}
                today={today}
                onSelectEvent={goToDay}
            />

            <NewsAssetFilter
                options={filterOptions}
                selected={selectedAsset}
                totalCount={news.length}
                onChange={changeAsset}
            />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                {/* Keyed by the filter so "Show more" starts over for each asset */}
                <NewsFeed
                    key={selectedAsset}
                    news={visibleNews}
                    logos={logos}
                    hasPositions={assets.length > 0}
                />
                <EventsCalendar
                    events={visibleEvents}
                    logos={logos}
                    today={today}
                    month={month}
                    selectedDay={selectedDay}
                    onMonthChange={changeMonth}
                    onSelectDay={selectDay}
                    onGoToDay={goToDay}
                    onShowNews={changeAsset}
                />
            </div>
        </>
    )
}
