import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SUMMARY_KEYS = ['next-event', 'this-week', 'following'] as const
const CHIP_KEYS = ['chip-1', 'chip-2', 'chip-3', 'chip-4', 'chip-5'] as const
const NEWS_GROUPS = [
    { key: 'today', rows: 3 },
    { key: 'yesterday', rows: 2 },
] as const
const CALENDAR_CELL_KEYS = Array.from({ length: 35 }, (_, index) => `cell-${index}`)
const LEGEND_KEYS = ['legend-1', 'legend-2', 'legend-3'] as const
const UPCOMING_KEYS = ['upcoming-1', 'upcoming-2', 'upcoming-3'] as const

export default function Loading() {
    return (
        <main className="flex flex-col gap-6 mb-24 min-w-0" id="main">
            <section className="grid gap-4 sm:grid-cols-3">
                {SUMMARY_KEYS.map((key) => (
                    <div
                        key={key}
                        className="flex flex-col gap-2 bg-card p-4 shadow-sm ring-1 ring-foreground/10"
                    >
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20 rounded-xl" />
                            <Skeleton className="size-4 rounded-xl" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-xl" />
                        <Skeleton className="h-3 w-36 rounded-xl" />
                    </div>
                ))}
            </section>

            <div className="flex flex-wrap gap-2">
                {CHIP_KEYS.map((key) => (
                    <Skeleton key={key} className="h-9 w-20 rounded-xl" />
                ))}
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Card className="w-full min-w-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                        <CardTitle>News</CardTitle>
                        <Skeleton className="h-3 w-16 rounded-xl" />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                        {NEWS_GROUPS.map((group) => (
                            <div key={group.key} className="flex flex-col">
                                <div className="flex items-center justify-between border-b bg-muted px-3 py-2">
                                    <Skeleton className="h-3 w-20 rounded-xl bg-background" />
                                    <Skeleton className="h-3 w-14 rounded-xl bg-background" />
                                </div>
                                {Array.from({ length: group.rows }, (_, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 border-b px-3 py-3.5 last:border-b-0"
                                    >
                                        <Skeleton className="mt-0.5 size-8 shrink-0 rounded-xl" />
                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            <Skeleton className="h-4 w-full rounded-xl" />
                                            <Skeleton className="h-4 w-3/4 rounded-xl" />
                                            <div className="flex gap-2">
                                                <Skeleton className="h-5 w-12 rounded-xl" />
                                                <Skeleton className="h-5 w-28 rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="w-full min-w-0 shadow-sm">
                    <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32 rounded-xl" />
                                <div className="flex gap-1">
                                    <Skeleton className="size-9 rounded-xl" />
                                    <Skeleton className="h-9 w-14 rounded-xl" />
                                    <Skeleton className="size-9 rounded-xl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {CALENDAR_CELL_KEYS.map((key) => (
                                    <Skeleton
                                        key={key}
                                        className="aspect-square min-h-9 rounded-xl"
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {LEGEND_KEYS.map((key) => (
                                    <Skeleton key={key} className="h-3 w-20 rounded-xl" />
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 border-t pt-4">
                            <Skeleton className="h-4 w-44 rounded-xl" />
                            <Skeleton className="h-4 w-36 rounded-xl" />
                        </div>

                        <div className="flex flex-col gap-2 border-t pt-4">
                            <Skeleton className="h-3 w-20 rounded-xl" />
                            {UPCOMING_KEYS.map((key) => (
                                <div key={key} className="flex items-center gap-3 p-2">
                                    <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                                    <div className="flex flex-1 flex-col gap-1.5">
                                        <Skeleton className="h-4 w-20 rounded-xl" />
                                        <Skeleton className="h-3 w-28 rounded-xl" />
                                    </div>
                                    <Skeleton className="h-3 w-16 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
