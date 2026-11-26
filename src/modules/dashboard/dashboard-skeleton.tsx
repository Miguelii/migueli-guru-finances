import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ASSET_CLASS_ORDER, ASSET_TYPE_META } from '@/lib/constants/asset-types'
import { POSITIONS_ROUTE_PATH, TRANSACTIONS_ROUTE_PATH } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'
import { DashboardHighlightsSkeleton } from '@/modules/dashboard/dashboard-highlights-skeleton'
import {
    ALLOCATION_ROW_KEYS,
    ALLOCATION_STAT_LABELS,
    ASSET_CLASS_STAT_LABELS,
    KPI_SKELETONS,
    RECENT_TRANSACTION_KEYS,
} from '@/modules/dashboard/dashboard-skeleton.constants'
import {
    VALUE_CHART_CONFIG,
    VALUE_CHART_LEGEND,
} from '@/modules/dashboard/performance-chart.constants'

// Loading state of the dashboard: the real cards, titles and labels, with skeletons where the data goes
export function DashboardSkeleton() {
    return (
        <main
            className="mb-24 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
            id="main"
            aria-busy="true"
        >
            <span className="sr-only" role="status">
                Loading dashboard
            </span>

            <div className="flex min-w-0 flex-col gap-6">
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">Dashboard</p>
                    <Skeleton className="my-1 h-6 w-56" />
                    <p className="text-sm text-muted-foreground">
                        Here&apos;s a quick look at your portfolio.
                    </p>
                </div>

                <section
                    aria-label="Key figures"
                    className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6"
                >
                    {KPI_SKELETONS.map(({ title, icon: Icon, accentClassName }) => (
                        <Card key={title} className="gap-3 p-5">
                            <div className="flex items-center gap-3">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'grid size-9 shrink-0 place-items-center rounded-xl',
                                        accentClassName
                                    )}
                                >
                                    <Icon className="size-4.5" />
                                </span>
                                <h2 className="text-sm text-muted-foreground">{title}</h2>
                            </div>
                            <Skeleton className="my-1 h-7 w-36" />
                            <div className="flex items-end justify-between gap-3">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-11 w-24" />
                            </div>
                        </Card>
                    ))}
                </section>

                <section
                    aria-label="Asset classes"
                    className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6"
                >
                    {ASSET_CLASS_ORDER.map((type) => {
                        const { label, icon: Icon, softClassName } = ASSET_TYPE_META[type]

                        return (
                            <Card key={type} className="gap-4 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="flex items-center gap-3 text-sm font-medium">
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'grid size-9 shrink-0 place-items-center rounded-xl',
                                                softClassName
                                            )}
                                        >
                                            <Icon className="size-4.5" />
                                        </span>
                                        {label}
                                    </h2>
                                    <Skeleton className="h-5 w-14" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="my-1 h-7 w-32" />
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 flex-1 rounded-full bg-muted" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <dl className="flex flex-col gap-2 border-t pt-3">
                                    {ASSET_CLASS_STAT_LABELS.map((statLabel) => (
                                        <div
                                            key={statLabel}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <dt className="text-xs text-muted-foreground">
                                                {statLabel}
                                            </dt>
                                            <dd>
                                                <Skeleton className="h-3 w-16" />
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </Card>
                        )
                    })}
                </section>

                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                    <Card aria-labelledby="performance-title" className="min-w-0 gap-4 p-5">
                        <DashboardCardHeader
                            id="performance-title"
                            title="Performance"
                            subtitle="Unrealized gain"
                            actions={
                                <>
                                    <ul
                                        aria-label="Chart legend"
                                        className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex"
                                    >
                                        {VALUE_CHART_LEGEND.map((entry) => (
                                            <li
                                                key={entry.key}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'shrink-0 rounded-full',
                                                        entry.swatchClassName
                                                    )}
                                                />
                                                {VALUE_CHART_CONFIG[entry.key].label}
                                            </li>
                                        ))}
                                    </ul>
                                    <Skeleton className="h-8 w-40 rounded-lg" />
                                </>
                            }
                        />
                        <Skeleton className="-mt-1 h-7 w-32" />
                        <Skeleton className="h-64 w-full rounded-lg lg:h-full lg:min-h-64" />
                    </Card>

                    <Card aria-labelledby="allocation-title" className="gap-5 p-5">
                        <DashboardCardHeader
                            id="allocation-title"
                            title="Allocation"
                            href={POSITIONS_ROUTE_PATH}
                            linkLabel="View positions"
                        />
                        <dl className="flex flex-wrap justify-between gap-x-6 gap-y-3">
                            {ALLOCATION_STAT_LABELS.map((statLabel) => (
                                <div key={statLabel} className="flex flex-col gap-1">
                                    <dt className="text-xs text-muted-foreground">{statLabel}</dt>
                                    <dd>
                                        <Skeleton className="h-4 w-16" />
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <div className="flex flex-col gap-2">
                            <div className="h-2 w-full rounded-full bg-muted" />
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-8 w-full rounded-lg" />
                            <ul className="flex flex-col gap-4">
                                {ALLOCATION_ROW_KEYS.map((key) => (
                                    <li key={key} className="flex items-center gap-3">
                                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            <div className="flex justify-between gap-3">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-4 w-16" />
                                            </div>
                                            <div className="h-1.5 rounded-full bg-muted" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                </div>

                <Card aria-labelledby="recent-transactions-title" className="gap-3 p-5">
                    <DashboardCardHeader
                        id="recent-transactions-title"
                        title="Recent transactions"
                        href={TRANSACTIONS_ROUTE_PATH}
                        linkLabel="View all"
                    />
                    <ul className="-mx-2 flex flex-col">
                        {RECENT_TRANSACTION_KEYS.map((key) => (
                            <li
                                key={key}
                                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-2 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto_7rem]"
                            >
                                <Skeleton className="size-9 rounded-full" />
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-4 w-14" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="hidden h-3 w-24 sm:block" />
                                <Skeleton className="ml-auto h-4 w-20" />
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <DashboardHighlightsSkeleton />
        </main>
    )
}
