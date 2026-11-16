import type { Currency } from '@/types/core/Currency'
import type { Ticker } from '@/types/core/Ticker'
import type { TickerService } from '@/types/core/TickerService'
import type { TickerType } from '@/types/core/TickerType'

export enum TransactionType {
    Buy = 'BUY',
    Sell = 'SELL',
    Reward = 'REWARD',
    Fee = 'FEE',
}

export type Transaction = {
    id: string
    ticker_id: Ticker
    type: TransactionType
    buy_date: `${number}-${number}-${number} ${number}:${number}:${number}`
    value?: number
    quantity?: number
    transaction_price?: number
    fee: number
    exchange_rate?: number // EUR multiplier at transaction date (EUR per 1 USD/USDC, e.g. 0.87): eurValue = value * exchange_rate
}

export type CambioRates = {
    usdToEur: number
    usdcToEur: number
}

export type TickerData = {
    ticker: Ticker
    curr_price: number
    last_updated_at:
        | `${number}-${number}-${number} ${number}:${number}:${number}`
        | `${number}-${number}-${number}T${number}:${number}:${number}`
    service: TickerService
    currency: Currency
    symbol: '€' | '$' | '€-$' | '$-€'
    logo?: `/${string}` | null
    hex_color?: string
    type: TickerType
    /** Extra search terms for the news feed (e.g. 'AtlasClear lawsuit') */
    news_keywords?: string | null
}
