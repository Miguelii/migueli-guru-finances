import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { MetricCardSkeleton } from '@/components/ui/metric-card'

const BADGE_KEYS = ['badge-1', 'badge-2', 'badge-3', 'badge-4', 'badge-5'] as const
const METRIC_KEYS = ['metric-1', 'metric-2', 'metric-3', 'metric-4'] as const
const TX_ROW_KEYS = ['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6'] as const
const HOLDING_KEYS = ['hold-1', 'hold-2', 'hold-3', 'hold-4', 'hold-5'] as const

export default function Loading() {
    return (
        <main className="flex flex-col gap-6 mb-24">
            {/* CurrentPricesBadges */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    {BADGE_KEYS.map((key) => (
                        <Skeleton key={key} className="h-10 w-28 shrink-0 rounded-none" />
                    ))}
                </div>
                <Skeleton className="h-3 w-40" />
            </div>

            {/* PortfolioSummaryCards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {METRIC_KEYS.map((key) => (
                    <MetricCardSkeleton key={key} />
                ))}
            </section>

            {/* Transactions + Allocation */}
            <section className="flex flex-col lg:flex-row gap-6">
                <Card className="flex w-full lg:w-[60%]! flex-col h-92.5 shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-6 w-28" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {TX_ROW_KEYS.map((key) => (
                            <Skeleton key={key} className="h-8 w-full" />
                        ))}
                    </CardContent>
                </Card>
                <Card className="h-92.5 w-full lg:w-[40%]! shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <Skeleton className="h-52 w-52 rounded-none" />
                    </CardContent>
                </Card>
            </section>

            {/* HoldingsCard */}
            <Card className="shadow-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {HOLDING_KEYS.map((key) => (
                        <Skeleton key={key} className="h-10 w-full" />
                    ))}
                </CardContent>
            </Card>
        </main>
    )
}
