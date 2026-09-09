import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { MetricCardSkeleton } from '@/components/ui/metric-card'

const METRIC_KEYS = ['metric-1', 'metric-2', 'metric-3', 'metric-4'] as const
const CHART_KEYS = ['chart-1', 'chart-2'] as const

export default function Loading() {
    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <Skeleton className="h-3 w-40" />
                <div className="flex flex-col md:flex-row gap-5 md:gap-2 w-full md:w-fit">
                    <Skeleton className="h-9 w-full md:w-32" />
                    <Skeleton className="h-9 w-full md:w-32" />
                </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {METRIC_KEYS.map((key) => (
                    <MetricCardSkeleton key={key} />
                ))}
            </section>

            <Card className="gap-0 py-0">
                <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-muted/50 py-3!">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-56" />
                </CardContent>
            </Card>

            <section className="flex flex-col items-start gap-6 lg:flex-row">
                {CHART_KEYS.map((key) => (
                    <Card key={key} className="w-full shadow-sm lg:flex-1">
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="flex items-center justify-center">
                            <Skeleton className="h-52 w-52 rounded-full" />
                        </CardContent>
                    </Card>
                ))}
            </section>
        </main>
    )
}
