import { LifeBuoyIcon, ReceiptTextIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EMERGENCY_FUND_ROUTE_PATH, POSITIONS_ROUTE_PATH } from '@/lib/constants'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'
import {
    MOVER_GROUPS,
    RECEIPT_LINE_KEYS,
    STAKING_ROW_KEYS,
} from '@/modules/dashboard/dashboard-highlights-skeleton.constants'

// Loading state of the dashboard side column (`DashboardHighlights`)
export function DashboardHighlightsSkeleton() {
    return (
        <aside aria-label="Highlights" className="flex min-w-0 flex-col gap-6">
            <LatestTransactionSkeleton />

            <Card aria-labelledby="goals-title" className="gap-4 p-5">
                <DashboardCardHeader
                    id="goals-title"
                    title="Goals"
                    href={EMERGENCY_FUND_ROUTE_PATH}
                    linkLabel="View"
                />
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success"
                    >
                        <LifeBuoyIcon className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-col gap-1">
                                <p className="text-sm font-medium">Emergency fund</p>
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-4 w-10" />
                        </div>
                        <div className="h-1.5 rounded-full bg-muted" />
                    </div>
                </div>
            </Card>

            <Card aria-labelledby="top-movers-title" className="gap-3 p-5">
                <DashboardCardHeader
                    id="top-movers-title"
                    title="Top movers"
                    href={POSITIONS_ROUTE_PATH}
                    linkLabel="View all"
                />
                <div className="flex flex-col gap-3">
                    {MOVER_GROUPS.map((group) => (
                        <div key={group.title} className="flex flex-col gap-1">
                            <h3 className="text-xs text-muted-foreground">{group.title}</h3>
                            <ul className="flex flex-col">
                                {group.keys.map((key) => (
                                    <ListRowSkeleton key={key} />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </Card>

            <Card aria-labelledby="staking-title" className="gap-3 p-5">
                <DashboardCardHeader
                    id="staking-title"
                    title="Staking"
                    subtitle="Estimated rewards on your staked crypto"
                />
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-7 w-24" />
                        <span className="text-sm text-muted-foreground">per year</span>
                    </div>
                    <Skeleton className="h-3 w-44" />
                </div>
                <ul className="flex flex-col border-t pt-1">
                    {STAKING_ROW_KEYS.map((key) => (
                        <ListRowSkeleton key={key} />
                    ))}
                </ul>
            </Card>
        </aside>
    )
}

// Asset row of the Top movers and Staking cards
const ListRowSkeleton = () => (
    <li className="flex items-center gap-3 py-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-14" />
    </li>
)

const LatestTransactionSkeleton = () => (
    <Card aria-labelledby="latest-transaction-title" className="gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
            <h2 id="latest-transaction-title" className="text-sm font-semibold">
                Last transaction
            </h2>
            <Skeleton className="h-5 w-12" />
        </div>

        <div className="flex flex-col gap-2">
            <Skeleton className="my-1 h-7 w-36" />
            <Skeleton className="h-7 w-24 rounded-lg" />
        </div>

        <div className="flex flex-col">
            <div className="relative z-10 h-5 rounded-xl bg-primary shadow-md">
                <span
                    aria-hidden="true"
                    className="absolute top-1/2 right-4 size-1.5 -translate-y-1/2 animate-pulse rounded-full bg-success"
                />
            </div>
            <div className="mx-3 -mt-2.5 drop-shadow-md">
                <div className="receipt-edge flex flex-col gap-3 bg-card px-4 pt-6 text-xs">
                    <div className="flex items-center justify-center gap-1.5">
                        <ReceiptTextIcon
                            aria-hidden="true"
                            className="size-3.5 text-muted-foreground"
                        />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <dl className="flex flex-col gap-2 border-y border-dashed py-3">
                        <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">Date</dt>
                            <dd>
                                <Skeleton className="h-3 w-24" />
                            </dd>
                        </div>
                        {RECEIPT_LINE_KEYS.map((key) => (
                            <div key={key} className="flex justify-between gap-3">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </dl>
                    <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <span>Total (EUR)</span>
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-9 rounded-lg" />
            <Skeleton className="h-9 rounded-lg" />
        </div>
    </Card>
)
