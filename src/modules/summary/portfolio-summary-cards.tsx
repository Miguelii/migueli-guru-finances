import type { HoldingSummary } from '@/types/Holding'
import { TickerType } from '@/types/Transaction'
import { Wallet, Bitcoin, BarChart3, TrendingUp } from 'lucide-react'
import { PortfolioSummaryCardsItem } from '@/modules/summary/portfolio-summary-cards-item'

type Props = {
    holdings: HoldingSummary[]
    hidePrices: boolean
}

export function PortfolioSummaryCards({ holdings, hidePrices }: Props) {
    const cryptoHoldings = holdings.filter((h) => h.tickerType === TickerType.Crypto)
    const etfHoldings = holdings.filter((h) => h.tickerType === TickerType.Etf)
    const stockHoldings = holdings.filter((h) => h.tickerType === TickerType.Stock)

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <PortfolioSummaryCardsItem
                title="Net Worth"
                icon={Wallet}
                holdings={holdings}
                hidePrices={hidePrices}
            />
            <PortfolioSummaryCardsItem
                title="Crypto"
                icon={Bitcoin}
                holdings={cryptoHoldings}
                hidePrices={hidePrices}
            />
            <PortfolioSummaryCardsItem
                title="ETFs"
                icon={BarChart3}
                holdings={etfHoldings}
                hidePrices={hidePrices}
            />
            <PortfolioSummaryCardsItem
                title="Stocks"
                icon={TrendingUp}
                holdings={stockHoldings}
                hidePrices={hidePrices}
            />
        </section>
    )
}
