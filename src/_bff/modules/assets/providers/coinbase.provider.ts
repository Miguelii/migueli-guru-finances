import type { PriceTicker } from '@/_bff/modules/assets/assets.dto'
import { Effect } from 'effect'
import { addDaysToDateKey } from '@/lib/portfolio/portfolio-snapshots'
import { GetCoinbasePriceError } from '@/_bff/modules/assets/assets.errors'
import {
    COINBASE_API_URL,
    COINBASE_DAILY_GRANULARITY,
    COINBASE_EXCHANGE_API_URL,
    COINBASE_MAX_CANDLES_PER_REQUEST,
} from '@/_bff/modules/assets/assets.constants'

type CoinbaseExchangeRatesJson = {
    data: {
        currency: string
        rates: Record<string, string>
    }
}

// [time (unix seconds, start of the UTC day), low, high, open, close, volume]
type CoinbaseCandle = [number, number, number, number, number, number]

type CoinbasePair = {
    ticker: string
    base: string
}

/**
 * Splits a ticker into its Coinbase base and quote currencies. Tickers like
 * 'USDC-EUR' already name the full pair, the rest are quoted in the asset currency.
 *
 * @param tick - The asset data containing the ticker symbol and currency
 */
function toCoinbasePair(tick: PriceTicker) {
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
            const res = await fetch(
                `${COINBASE_API_URL}/exchange-rates?currency=${encodeURIComponent(quote)}`,
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
    ticks: PriceTicker[]
): Effect.Effect<Map<string, number>, GetCoinbasePriceError> {
    const pairsByQuote = Map.groupBy(
        ticks.map((tick) => ({ ticker: tick.ticker, ...toCoinbasePair(tick) })),
        (pair) => pair.quote
    )

    return Effect.forEach(pairsByQuote, ([quote, pairs]) => getQuotePrices(quote, pairs), {
        concurrency: 'unbounded',
    }).pipe(Effect.map((prices) => new Map(prices.flat())))
}

/**
 * Fetches one window of daily candles (at most {@link COINBASE_MAX_CANDLES_PER_REQUEST}
 * days, both ends inclusive) and keys each close by its UTC day.
 *
 * @param product - Coinbase product id (e.g. 'BTC-EUR')
 * @param start - First day of the window, `YYYY-MM-DD`
 * @param end - Last day of the window, `YYYY-MM-DD`
 */
function getCandlesWindow(product: string, start: string, end: string) {
    return Effect.tryPromise({
        try: async () => {
            const params = new URLSearchParams({
                granularity: String(COINBASE_DAILY_GRANULARITY),
                start: `${start}T00:00:00Z`,
                end: `${end}T00:00:00Z`,
            })

            const res = await fetch(
                `${COINBASE_EXCHANGE_API_URL}/products/${encodeURIComponent(product)}/candles?${params}`,
                { method: 'GET' }
            )

            if (!res.ok) throw new Error(`Fetch Failed status=${res.status} product=${product}`)

            const candles: CoinbaseCandle[] = await res.json()

            if (!Array.isArray(candles)) throw new Error(`Invalid candles product=${product}`)

            return candles.map(
                ([time, , , , close]) =>
                    [new Date(time * 1000).toISOString().slice(0, 10), close] as const
            )
        },
        catch: (cause) =>
            new GetCoinbasePriceError({
                cause,
                message: 'Failed to fetch price history from Coinbase',
            }),
    })
}

/**
 * Fetches the daily closes of an asset from Coinbase Exchange between two days
 * (inclusive), paging sequentially through windows of the API maximum of candles so
 * long histories stay under the public rate limit.
 *
 * @param tick - The asset to price
 * @param from - First day, `YYYY-MM-DD`
 * @param to - Last day, `YYYY-MM-DD`
 * @returns An Effect resolving to a map of day to close price
 */
export function getCoinbasePriceHistory(
    tick: PriceTicker,
    from: string,
    to: string
): Effect.Effect<Map<string, number>, GetCoinbasePriceError> {
    const { base, quote } = toCoinbasePair(tick)
    const windows: { start: string; end: string }[] = []

    for (let start = from; start <= to; ) {
        const windowEnd = addDaysToDateKey(start, COINBASE_MAX_CANDLES_PER_REQUEST - 1)
        windows.push({ start, end: windowEnd < to ? windowEnd : to })
        start = addDaysToDateKey(windowEnd, 1)
    }

    return Effect.forEach(windows, ({ start, end }) =>
        getCandlesWindow(`${base}-${quote}`, start, end)
    ).pipe(Effect.map((closes) => new Map(closes.flat())))
}
