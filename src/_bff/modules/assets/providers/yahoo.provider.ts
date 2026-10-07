import type { TickerData } from '@/types/Transaction'
import YahooFinance from 'yahoo-finance2'
import { Effect } from 'effect'
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
