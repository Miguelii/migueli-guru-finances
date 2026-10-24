import { TickerType } from '@/types/core/TickerType'

export const PORTFOLIO_EXPORT_FILENAME = 'portfolio-overview.txt'

export const PORTFOLIO_EXPORT_TYPES = [TickerType.Crypto, TickerType.Etf, TickerType.Stock] as const
