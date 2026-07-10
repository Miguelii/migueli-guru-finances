import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_GROUPS = [
    { label: 'CRYPTO', rows: 4 },
    { label: 'ETF', rows: 2 },
    { label: 'STOCK', rows: 2 },
    { label: 'Cambio', rows: 1 },
] as const

export default function Loading() {
    return (
        <main className="flex flex-col gap-6 mb-24" id="#main">
            <Skeleton className="h-4 w-48" />
            <Card className="shadow-sm w-full min-w-0">
                <CardHeader className="flex flex-row items-center gap-2">
                    <CardTitle>Watchlist</CardTitle>
                    <Skeleton className="h-5 w-6 rounded-none" />
                </CardHeader>
                <CardContent className="grid gap-0 p-0">
                    {SKELETON_GROUPS.map((group) => (
                        <div key={group.label}>
                            <div className="flex items-center gap-2 border-t border-border bg-muted px-6 py-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {group.label}
                                </span>
                            </div>
                            {Array.from({ length: group.rows }, (_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between gap-4 border-t border-border/50 px-6 py-3 h-12"
                                >
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-none" />
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </main>
    )
}
