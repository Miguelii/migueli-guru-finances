import { buildLogoUrl } from '@/lib/utils'
import type { TickerData } from '@/types/Transaction'
import Image from 'next/image'

type Props = {
    tickerLogo: TickerData['logo']
    ticker: TickerData['ticker']
    tickerCurrency: TickerData['currency']
}

export function LogoAvatar({ tickerLogo, ticker, tickerCurrency }: Props) {
    return (
        <div className="flex items-center gap-2">
            {tickerLogo ? (
                <Image
                    src={buildLogoUrl(tickerLogo)}
                    alt={`${ticker} logo`}
                    width={24}
                    height={24}
                    className="rounded-none w-6 h-6"
                    unoptimized
                />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-none bg-muted text-xs font-semibold text-muted-foreground">
                    {ticker.slice(0, 2)}
                </div>
            )}
            <div>
                <div className="font-semibold">{ticker}</div>
                <div className="text-xs text-muted-foreground">{tickerCurrency}</div>
            </div>
        </div>
    )
}
