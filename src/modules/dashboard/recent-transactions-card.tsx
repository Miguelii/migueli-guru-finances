import Link from 'next/link'
import { AssetLogo } from '@/components/ui/asset-logo'
import { Card } from '@/components/ui/card'
import { TRANSACTIONS_ROUTE_PATH } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { CambioRates, TickerData, Transaction } from '@/types/Transaction'
import { TYPE_LABEL } from '@/modules/transactions/transactions-card/transactions-card.constants'
import { formatDayMonth, formatTime } from '@/modules/transactions/transaction-row.helpers'
import { DashboardCardHeader } from '@/modules/dashboard/dashboard-card-header'
import {
    RECENT_TRANSACTIONS_COUNT,
    TransactionDirection,
} from '@/modules/dashboard/recent-transactions-card.constants'
import {
    buildTransactionHref,
    getTransactionFlow,
} from '@/modules/dashboard/recent-transactions-card.helpers'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    hidePrices: boolean
}

export function RecentTransactionsCard({ transactions, tickerData, rates, hidePrices }: Props) {
    const recent = transactions.slice(0, RECENT_TRANSACTIONS_COUNT)

    return (
        <Card aria-labelledby="recent-transactions-title" className="gap-3 p-5">
            <DashboardCardHeader
                id="recent-transactions-title"
                title="Recent transactions"
                href={TRANSACTIONS_ROUTE_PATH}
                linkLabel="View all"
            />

            {recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No transactions yet
                </p>
            ) : (
                <ul className="-mx-2 flex flex-col">
                    {recent.map((tx) => {
                        const ticker = tickerData.find((td) => td.ticker === tx.ticker_id)
                        const flow = getTransactionFlow(tx, ticker?.currency ?? Currency.EUR, rates)

                        return (
                            <li key={tx.id}>
                                <Link
                                    href={buildTransactionHref(tx.id)}
                                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[auto_minmax(0,1fr)_auto_7rem]"
                                >
                                    <AssetLogo
                                        logo={ticker?.logo}
                                        ticker={tx.ticker_id}
                                        className="size-9"
                                    />
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-medium">
                                            {tx.ticker_id}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {TYPE_LABEL[tx.type]}
                                            <span className="sm:hidden">
                                                {' · '}
                                                {formatDayMonth(tx.buy_date)}
                                            </span>
                                        </span>
                                    </span>
                                    <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">
                                        {formatDayMonth(tx.buy_date)}, {formatTime(tx.buy_date)}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-right text-sm font-semibold tabular-nums',
                                            {
                                                'text-success':
                                                    flow.direction === TransactionDirection.In,
                                                'blur-sm select-none': hidePrices,
                                            }
                                        )}
                                    >
                                        {flow.label}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </Card>
    )
}
