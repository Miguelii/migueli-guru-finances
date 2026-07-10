import type { TickerData } from '@/types/Transaction'
import YahooFinance from 'yahoo-finance2'
import { Effect } from 'effect'
import { GetFinancePriceError } from '@/_bff/modules/assets/assets.errors'

/**
 * Fetches the current market price from Yahoo Finance for a given ticker.
 * Uses `regularMarketPrice` (falls back to `bid`, which can be null outside market hours).
 *
 * @param tick - The asset data containing the ticker symbol
 * @returns An Effect that resolves to the price as a number, or fails with an Error
 */
export function getFinancePrice(tick: TickerData): Effect.Effect<number | null, Error> {
    return Effect.tryPromise({
        try: async () => {
            const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
            const tickerToSearch = tick.ticker.toUpperCase()
            const quote = await yahooFinance.quote(tickerToSearch)

            const price = quote.regularMarketPrice ?? quote.bid

            if (price == null)
                throw new Error(`Fetch Failed quote price is null tick=${tick.ticker}`)

            return Number(price)
        },
        catch: (cause) =>
            new GetFinancePriceError({
                cause,
                message: `Failed to fetch price for |${tick.ticker}| from Yahoo Finance`,
            }),
    })
}
