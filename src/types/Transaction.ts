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

export enum TickerType {
    Crypto = 'CRYPTO',
    Etf = 'ETF',
    Stock = 'STOCK',
    Cambio = 'CAMBIO',
}

export enum TickerService {
    Coinbase = 'coinbase',
    Yahoo = 'yahoo',
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
    hex_color?: `#${number}`
    type: TickerType
}
