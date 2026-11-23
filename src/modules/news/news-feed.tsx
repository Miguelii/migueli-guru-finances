'use client'

import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NewsItem } from '@/types/News'
import type { TickerData } from '@/types/Transaction'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import { NewsRow } from '@/modules/news/news-row'
import { NEWS_PAGE_SIZE } from '@/modules/news/news-feed.constants'
import { groupNewsByDay } from '@/modules/news/news-feed.helpers'

type Props = Readonly<{
    news: NewsItem[]
    logos: Map<string, TickerData['logo']>
    hasPositions: boolean
}>

export function NewsFeed({ news, logos, hasPositions }: Props) {
    const [visibleCount, setVisibleCount] = useState(NEWS_PAGE_SIZE)

    const groups = groupNewsByDay(news.slice(0, visibleCount), new Date())
    const remaining = news.length - visibleCount

    return (
        <PortfolioCard
            cardId="news"
            title="News"
            className="min-w-0"
            openHeightClassName="h-auto"
            actions={
                <span className="text-xs text-muted-foreground tabular-nums">
                    {news.length} {news.length === 1 ? 'story' : 'stories'}
                </span>
            }
            contentClassName="flex w-full min-w-0 flex-col gap-4"
        >
            {groups.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <p className="text-sm font-medium">
                        {hasPositions ? 'No recent news' : 'No open positions'}
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                        {hasPositions
                            ? 'Nothing from the last 30 days. Add search terms to an asset in the Watchlist to follow a specific story.'
                            : 'Add a transaction to follow the news of that asset.'}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {groups.map((group) => (
                        <section
                            key={group.day}
                            aria-labelledby={`news-${group.day}`}
                            className="flex flex-col"
                        >
                            <header className="flex items-baseline justify-between gap-3 border-b bg-muted px-3 py-2">
                                <h3
                                    id={`news-${group.day}`}
                                    className="text-xs font-semibold tracking-wide uppercase"
                                >
                                    {group.label}
                                </h3>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {group.items.length}{' '}
                                    {group.items.length === 1 ? 'story' : 'stories'}
                                </span>
                            </header>
                            <ul className="flex flex-col divide-y">
                                {group.items.map((item) => (
                                    <NewsRow
                                        key={item.id}
                                        item={item}
                                        logo={logos.get(item.ticker)}
                                    />
                                ))}
                            </ul>
                        </section>
                    ))}

                    {remaining > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setVisibleCount((count) => count + NEWS_PAGE_SIZE)}
                            className="h-10 w-full cursor-pointer gap-1.5"
                        >
                            <span>Show more</span>
                            <span className="text-muted-foreground tabular-nums">
                                ({remaining})
                            </span>
                            <ChevronDownIcon aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                </div>
            )}
        </PortfolioCard>
    )
}
