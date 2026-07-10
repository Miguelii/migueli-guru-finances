import type { TickerData } from '@/types/Transaction'
import { Effect } from 'effect'
import { GetCoinbasePriceError } from '@/_bff/modules/assets/assets.errors'

type CoinbaseJson = {
    data: {
        amount: string
        currency: string
    }
}

/**
 * Fetches the current sell price from the Coinbase API for a given asset.
 *
 * @param tick - The asset data containing the ticker symbol and currency
 * @returns An Effect that resolves to the price as a number, or `null` if unavailable
 */
export function getCoinbasePrice(tick: TickerData): Effect.Effect<number | null, Error> {
    return Effect.tryPromise({
        try: async () => {
            // Tickers like 'USDC-EUR' already name the full pair
            const pair = tick.ticker.includes('-')
                ? tick.ticker.toUpperCase()
                : `${tick.ticker.toUpperCase()}-${tick.currency.toUpperCase()}`

            // Public endpoint — no authentication required
            const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/sell`, {
                method: 'GET',
            })

            if (!res.ok) throw new Error(`Fetch Failed status=${res.status} tick=${tick.ticker}`)

            const json: CoinbaseJson = await res.json()

            return json?.data?.amount ? Number(json.data.amount) : null
        },
        catch: (cause) => new GetCoinbasePriceError({ cause }),
    })
}
