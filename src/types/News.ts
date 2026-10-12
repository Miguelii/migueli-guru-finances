import type { Ticker } from '@/types/Transaction'

export enum NewsProvider {
    Yahoo = 'yahoo',
    Google = 'google',
}

export type NewsItem = {
    id: string
    ticker: Ticker
    title: string
    source: string
    url: string
    /** ISO timestamp */
    publishedAt: string
    provider: NewsProvider
    /** Found by the asset's own search terms (`news_keywords`) */
    fromKeywords: boolean
}

export enum PortfolioEventType {
    Earnings = 'EARNINGS',
    ExDividend = 'EX_DIVIDEND',
    DividendPayment = 'DIVIDEND_PAYMENT',
}

export type PortfolioEvent = {
    id: string
    ticker: Ticker
    type: PortfolioEventType
    /** Day key in `YYYY-MM-DD` format (UTC day of the event) */
    date: string
    /** The company has not confirmed the date yet (earnings only) */
    isEstimate: boolean
}
