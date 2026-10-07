import type { TickerData } from '@/types/Transaction'
import { Effect } from 'effect'
import { GetCoinbasePriceError } from '@/_bff/modules/assets/assets.errors'

type CoinbaseExchangeRatesJson = {
    data: {
        currency: string
        rates: Record<string, string>
    }
}

type CoinbasePair = {
    ticker: TickerData['ticker']
    base: string
}

/**
 * Splits a ticker into its Coinbase base and quote currencies. Tickers like
 * 'USDC-EUR' already name the full pair, the rest are quoted in the asset currency.
 *
 * @param tick - The asset data containing the ticker symbol and currency
 */
function toCoinbasePair(tick: TickerData): { base: string; quote: string } {
    if (tick.ticker.includes('-')) {
        const [base, quote] = tick.ticker.toUpperCase().split('-')
        return { base, quote }
    }

    return { base: tick.ticker.toUpperCase(), quote: tick.currency.toUpperCase() }
}

/**
 * Fetches every Coinbase exchange rate for a quote currency (one request) and
 * resolves the price of each pair as `1 / rate`, rounded to 10 significant digits
 * to drop the float noise of the inversion. Pairs Coinbase does not know are omitted.
 *
 * @param quote - The quote currency (e.g. 'EUR')
 * @param pairs - The tickers quoted in that currency with their base currency
 */
function getQuotePrices(quote: string, pairs: CoinbasePair[]) {
    return Effect.tryPromise({
        try: async () => {
            // Public endpoint, no authentication required
            const res = await fetch(
                `https://api.coinbase.com/v2/exchange-rates?currency=${encodeURIComponent(quote)}`,
                { method: 'GET' }
            )

            if (!res.ok) throw new Error(`Fetch Failed status=${res.status} quote=${quote}`)

            const json: CoinbaseExchangeRatesJson = await res.json()
            const rates = json?.data?.rates ?? {}

            return pairs.flatMap(({ ticker, base }) => {
                const rate = Number(rates[base])
                if (!Number.isFinite(rate) || rate <= 0) return []

                return [[ticker, Number((1 / rate).toPrecision(10))] as const]
            })
        },
        catch: (cause) => new GetCoinbasePriceError({ cause }),
    })
}

/**
 * Fetches the current prices of several assets from Coinbase with one request per
 * quote currency, instead of one per asset.
 *
 * @param ticks - The assets to price
 * @returns An Effect resolving to a map of ticker to price, missing the unknown pairs
 */
export function getCoinbasePrices(
    ticks: TickerData[]
): Effect.Effect<Map<TickerData['ticker'], number>, GetCoinbasePriceError> {
    const pairsByQuote = Map.groupBy(
        ticks.map((tick) => ({ ticker: tick.ticker, ...toCoinbasePair(tick) })),
        (pair) => pair.quote
    )

    return Effect.forEach(pairsByQuote, ([quote, pairs]) => getQuotePrices(quote, pairs), {
        concurrency: 'unbounded',
    }).pipe(Effect.map((prices) => new Map(prices.flat())))
}
