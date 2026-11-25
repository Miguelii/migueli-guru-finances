import { Schedule } from 'effect'

export const GET_ASSET_NEWS_CACHE_KEY = 'getAssetNews'

export const GET_ASSET_NEWS_REVALIDATE_TIME = 3600 // 1h

export const GET_ASSET_EVENTS_CACHE_KEY = 'getAssetEvents'

export const GET_ASSET_EVENTS_REVALIDATE_TIME = 43200 // 12h

// Company names barely change: cached a day under the news tag
export const GET_ASSET_NAMES_REVALIDATE_TIME = 86400 // 24h

export const NEWS_ASSET_COLUMNS = 'ticker, type, service, currency, news_keywords'

export const GOOGLE_NEWS_RSS_URL = 'https://news.google.com/rss/search'

export const YAHOO_NEWS_COUNT = 10

export const NEWS_MAX_AGE_DAYS = 30

export const NEWS_PER_ASSET = 8

// Slots of NEWS_PER_ASSET kept for the user's search terms, so the broad name search
// (dozens of results) never crowds out the story the user asked to follow
export const NEWS_KEYWORD_SLOTS_PER_ASSET = 4

export const NEWS_MAX_ITEMS = 60

// Assets fetched at the same time (each one fires 2 or 3 source requests)
export const NEWS_FETCH_CONCURRENCY = 4

// Per-source cap on user-facing reads, so a hanging source cannot stall the page
export const NEWS_SOURCE_TIMEOUT = '5 seconds'

// Short retry for user-facing reads: ~500ms, max 1 retry (the crons keep the 2s policy)
export const NEWS_RETRY_POLICY = Schedule.max([
    Schedule.exponential('500 millis').pipe(Schedule.jittered),
    Schedule.recurs(1),
])
