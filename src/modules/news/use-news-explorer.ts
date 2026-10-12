'use client'

import { useState } from 'react'
import { useQueryState } from 'nuqs'
import { ALL_NEWS_ASSETS } from '@/lib/constants/news'
import { newsAssetParser, paramsUrlKeys } from '@/lib/core/searchParams'
import type { NewsItem, PortfolioEvent } from '@/types/News'
import type { TickerData } from '@/types/Transaction'
import { getUpcomingEvents, toCalendarMonth } from '@/modules/news/events-calendar.helpers'
import { buildAssetFilterOptions, filterByAsset } from '@/modules/news/news-explorer.helpers'

type Params = {
    news: NewsItem[]
    events: PortfolioEvent[]
    assets: TickerData[]
    today: string
}

// One asset filter for the whole page (feed and calendar), kept in the URL
export function useNewsExplorer({ news, events, assets, today }: Params) {
    const [asset, setAsset] = useQueryState(
        paramsUrlKeys.news_asset!,
        newsAssetParser.withOptions({ shallow: true })
    )
    const [selectedDay, setSelectedDay] = useState(today)
    const [month, setMonth] = useState(() => toCalendarMonth(today))

    const filterOptions = buildAssetFilterOptions(assets, news, events)
    const selectedAsset = filterOptions.some((option) => option.ticker === asset)
        ? asset
        : ALL_NEWS_ASSETS
    const visibleEvents = filterByAsset(events, selectedAsset)

    const goToDay = (date: string) => {
        setSelectedDay(date)
        setMonth(toCalendarMonth(date))
    }

    return {
        filterOptions,
        selectedAsset,
        visibleNews: filterByAsset(news, selectedAsset),
        visibleEvents,
        nextEvent: getUpcomingEvents(visibleEvents, today, 1).at(0),
        selectedDay,
        month,
        logos: new Map(assets.map((item) => [item.ticker, item.logo])),
        changeAsset: (ticker: string) => void setAsset(ticker),
        changeMonth: setMonth,
        selectDay: setSelectedDay,
        goToDay,
    }
}
