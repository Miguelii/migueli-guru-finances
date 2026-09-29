import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

const STAT_KEYS = ['stat-1', 'stat-2', 'stat-3'] as const
const ASSET_CLASS_KEYS = ['asset-class-1', 'asset-class-2', 'asset-class-3'] as const
const LEGEND_KEYS = ['legend-1', 'legend-2', 'legend-3', 'legend-4'] as const
const MOVER_KEYS = ['mover-1', 'mover-2', 'mover-3', 'mover-4', 'mover-5', 'mover-6'] as const
const GOAL_KEYS = ['goal-1', 'goal-2'] as const

export default function Loading() {
    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0">
            <Card className="gap-0 py-0 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <div className="flex flex-col gap-6 border-b p-5 lg:border-r lg:border-b-0 lg:p-6">
                    <Skeleton className="h-3 w-20" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-56 md:h-12" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-y py-4">
                        {STAT_KEYS.map((key) => (
                            <div key={key} className="flex flex-col gap-1">
                                <Skeleton className="h-3 w-14" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
                <div className="flex flex-col gap-4 p-5 lg:p-6">
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-56 w-full lg:h-full lg:min-h-56" />
                </div>
            </Card>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
                {ASSET_CLASS_KEYS.map((key) => (
                    <Card key={key} className="gap-0 py-0">
                        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-0">
                            <Skeleton className="h-7 w-24" />
                            <Skeleton className="h-5 w-14" />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 py-4">
                            <Skeleton className="h-8 w-36" />
                            <Skeleton className="h-1 w-full" />
                            <div className="flex flex-col gap-2 border-t pt-3">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="flex flex-col items-start gap-6 lg:flex-row">
                <Card className="w-full lg:flex-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-8 w-40" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                        <Skeleton className="mx-auto aspect-square w-full max-w-65 rounded-full" />
                        <div className="flex flex-col gap-3">
                            {LEGEND_KEYS.map((key) => (
                                <Skeleton key={key} className="h-6 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="w-full lg:w-80 lg:shrink-0 xl:w-96">
                    <CardHeader>
                        <Skeleton className="h-5 w-28" />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {MOVER_KEYS.map((key) => (
                            <Skeleton key={key} className="h-9 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </section>

            <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                {GOAL_KEYS.map((key) => (
                    <Card key={key}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                    </Card>
                ))}
            </section>
        </main>
    )
}
