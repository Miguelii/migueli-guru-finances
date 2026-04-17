import type { Ticker, TickerData } from '@/types/Transaction'

export type HoldingSummary = {
    ticker_id: Ticker
    symbol: TickerData['ticker']
    tickerLogo: TickerData['logo']
    tickerHexColor: TickerData['hex_color']
    tickerType: TickerData['type']
    currency: TickerData['currency']
    total_quantity: number
    total_invested: number
    total_fees: number
    current_price: number
    current_value: number
    avg_cost_per_share: number
    realized_gl: number
    unrealized_gl: number
    unrealized_gl_pct: number
    unrealized_gl_with_fees: number
    unrealized_gl_with_fees_pct: number
    total_gl: number
    total_gl_pct: number
    total_gl_with_fees: number
    total_gl_with_fees_pct: number
}
