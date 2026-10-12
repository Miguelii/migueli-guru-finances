import type { Metadata } from 'next'
import { createCaller } from '@/_bff/trpc/caller'
import { NEWS_TIME_ZONE } from '@/lib/constants/news'
import { getOpenPositionTickers } from '@/lib/portfolio/calculations'
import { getPortfolioData } from '@/lib/portfolio/portfolio-data.server'
import { toDateKey } from '@/lib/portfolio/portfolio-snapshots'
import { NewsExplorer } from '@/modules/news/news-explorer'

export const metadata: Metadata = {
    title: 'News | Migueli Guru Finances',
}

export default async function NewsPage() {
    const [trpc, { holdings, data }] = await Promise.all([createCaller(), getPortfolioData()])

    const tickers = getOpenPositionTickers(holdings)
    const assets = data.filter((asset) => tickers.includes(asset.ticker))

    const [news, events] = await Promise.all([
        trpc.news.get({ tickers }),
        trpc.news.getEvents({ tickers }),
    ])

    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <NewsExplorer
                news={news}
                events={events}
                assets={assets}
                today={toDateKey(new Date(), NEWS_TIME_ZONE)}
            />
        </main>
    )
}
