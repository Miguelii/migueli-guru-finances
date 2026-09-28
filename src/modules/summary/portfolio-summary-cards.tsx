import type { HoldingSummary } from '@/types/Holding'
import type { BankBalanceSummary } from '@/types/BankConnection'
import { TickerType } from '@/types/Transaction'
import { Wallet, Bitcoin, BarChart3, TrendingUp, Landmark } from 'lucide-react'
import { PortfolioSummaryCardsItem } from '@/modules/summary/portfolio-summary-cards-item'
import { EmergencyFundCard } from '@/modules/emergency-fund/emergency-fund-card'

type Props = {
    holdings: HoldingSummary[]
    bankBalance: BankBalanceSummary
    hidePrices: boolean
}

export function PortfolioSummaryCards({ holdings, bankBalance, hidePrices }: Props) {
    const cryptoHoldings = holdings.filter((h) => h.tickerType === TickerType.Crypto)
    const etfHoldings = holdings.filter((h) => h.tickerType === TickerType.Etf)
    const stockHoldings = holdings.filter((h) => h.tickerType === TickerType.Stock)
    const nonCryptoHoldings = holdings.filter((h) => h.tickerType !== TickerType.Crypto)

    return (
        <div className="flex flex-col gap-5 w-full">
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
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
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                <PortfolioSummaryCardsItem
                    title="Stocks"
                    icon={TrendingUp}
                    holdings={stockHoldings}
                    hidePrices={hidePrices}
                />
                <PortfolioSummaryCardsItem
                    title="Net Worth (no crypto)"
                    icon={Landmark}
                    holdings={nonCryptoHoldings}
                    hidePrices={hidePrices}
                />
                <EmergencyFundCard summary={bankBalance} hidePrices={hidePrices} />
            </section>
        </div>
    )
}
