import type { TickerData } from '@/types/Transaction'
import YahooFinance from 'yahoo-finance2'
import { Effect } from 'effect'
import { addDaysToDateKey, toDateKey } from '@/lib/portfolio/portfolio-snapshots'
import { GetFinancePriceError } from '@/_bff/modules/assets/assets.errors'

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

/**
 * Fetches the current market prices of several tickers from Yahoo Finance in a single
 * request. Uses `regularMarketPrice` (falls back to `bid`, which can be null outside
 * market hours). Symbols Yahoo does not know, or without a price, are omitted.
 *
 * @param ticks - The assets containing the ticker symbols
 * @returns An Effect resolving to a map of ticker to price
 */
export function getFinancePrices(
    ticks: TickerData[]
): Effect.Effect<Map<TickerData['ticker'], number>, GetFinancePriceError> {
    return Effect.tryPromise({
        try: async () => {
            const symbols = ticks.map((tick) => tick.ticker.toUpperCase())
            const quotes = await yahooFinance.quote(symbols, {
                return: 'object',
                fields: ['regularMarketPrice', 'bid'],
            })

            return new Map(
                ticks.flatMap((tick) => {
                    const quote = quotes[tick.ticker.toUpperCase()]
                    const price = quote?.regularMarketPrice ?? quote?.bid

                    return price == null ? [] : [[tick.ticker, Number(price)] as const]
                })
            )
        },
        catch: (cause) =>
            new GetFinancePriceError({
                cause,
                message: 'Failed to fetch prices from Yahoo Finance',
            }),
    })
}

/**
 * Fetches the daily closes of a ticker from Yahoo Finance between two days (inclusive),
 * keyed by the calendar day of each bar in the exchange time zone (a London bar at
 * 23:00 UTC in summer belongs to the next day). Bars without a close are omitted.
 *
 * @param tick - The asset containing the ticker symbol
 * @param from - First day, `YYYY-MM-DD`
 * @param to - Last day, `YYYY-MM-DD`
 * @returns An Effect resolving to a map of day to close price
 */
export function getFinancePriceHistory(
    tick: TickerData,
    from: string,
    to: string
): Effect.Effect<Map<string, number>, GetFinancePriceError> {
    return Effect.tryPromise({
        try: async () => {
            const { meta, quotes } = await yahooFinance.chart(tick.ticker.toUpperCase(), {
                period1: from,
                period2: addDaysToDateKey(to, 1),
                interval: '1d',
            })

            return new Map(
                quotes.flatMap((quote) =>
                    quote.close == null
                        ? []
                        : [
                              [
                                  toDateKey(quote.date, meta.exchangeTimezoneName),
                                  Number(quote.close),
                              ] as const,
                          ]
                )
            )
        },
        catch: (cause) =>
            new GetFinancePriceError({
                cause,
                message: 'Failed to fetch price history from Yahoo Finance',
            }),
    })
}
