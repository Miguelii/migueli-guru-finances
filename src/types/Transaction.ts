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
    buy_price?: number
    fee: number
}

export enum Ticker {
    ETH = 'ETH',
    SOL = 'SOL',
    BTC = 'BTC',
    ATCH = 'ATCH',
    VUAA = 'VUAA',
    MON = 'MON',
    USD_EUR = 'EUR=X',
    USDC_EUR = 'USDC-EUR',
}

export enum Currency {
    EUR = 'EUR',
    USD = 'USD',
    USDC = 'USDC',
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
    service: 'coinbase' | 'yahoo'
    currency: Currency
    symbol: '€' | '$' | '€-$' | '$-€'
    logo?: `/assets/${string}` | '/none'
    hex_color?: `#${number}`
    type: 'CRYPTO' | 'ETF' | 'STOCK' | 'CAMBIO'
}
