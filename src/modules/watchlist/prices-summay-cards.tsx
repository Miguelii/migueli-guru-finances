import type { TickerData } from '@/types/Transaction'
import { formatCurrency } from '@/lib/formaters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { groupAssetsByType } from '@/lib/utils'
import { AddAssetApp } from '@/modules/watchlist/add-asset-app'
import { AssetActions } from '@/modules/watchlist/asset-actions'
import { LogoAvatar } from '@/components/logo-avatar'

type Props = {
    data: TickerData[]
}

const ASSETS_GROUP_ORDER: TickerData['type'][] = ['CRYPTO', 'ETF', 'STOCK', 'CAMBIO'] as const

export function PricesSummaryCards({ data }: Props) {
    const groups = groupAssetsByType(data)

    return (
        <Card className="shadow-sm w-full min-w-0">
            <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Watchlist</CardTitle>
                <Badge variant="secondary" className="text-xs tabular-nums">
                    {data.length}
                </Badge>
                <div className="ml-auto">
                    <AddAssetApp />
                </div>
            </CardHeader>
            <CardContent className="grid gap-0 p-0">
                {ASSETS_GROUP_ORDER.map((type) => {
                    const tickers = groups.get(type)
                    if (!tickers) return null

                    return (
                        <div key={type}>
                            <div className="flex items-center gap-2 border-t border-border bg-muted px-6 py-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {type}
                                </span>
                                <span className="text-[10px] tabular-nums text-muted-foreground/60">
                                    {tickers.length}
                                </span>
                            </div>
                            {tickers.map((tick) => (
                                <div
                                    key={`watchlist-${tick.ticker}`}
                                    className="flex items-center justify-between gap-4 border-t border-border/50 px-6 py-3 transition-colors hover:bg-muted/50 cursor-pointer h-12"
                                >
                                    <LogoAvatar
                                        tickerLogo={tick.logo}
                                        ticker={tick.ticker}
                                        tickerCurrency={tick.currency}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold tabular-nums tracking-tight text-primary">
                                            {formatCurrency(tick.curr_price, tick.currency, 4)}
                                        </span>
                                        <AssetActions asset={tick} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
