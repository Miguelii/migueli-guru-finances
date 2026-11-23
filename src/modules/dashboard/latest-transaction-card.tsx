import Link from 'next/link'
import { HistoryIcon, ReceiptTextIcon } from 'lucide-react'
import { AssetLogo } from '@/components/ui/asset-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TRANSACTIONS_ROUTE_PATH } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Currency } from '@/types/core/Currency'
import type { CambioRates, TickerData, Transaction } from '@/types/Transaction'
import {
    TYPE_BADGE_VARIANT,
    TYPE_LABEL,
} from '@/modules/transactions/transactions-card/transactions-card.constants'
import { formatDateTime, formatDayMonth } from '@/modules/transactions/transaction-row.helpers'
import { TransactionDirection } from '@/modules/dashboard/recent-transactions-card.constants'
import {
    buildTransactionHref,
    getTransactionFlow,
} from '@/modules/dashboard/recent-transactions-card.helpers'
import {
    buildReceiptLines,
    toReceiptNumber,
} from '@/modules/dashboard/latest-transaction-card.helpers'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    hidePrices: boolean
}

export function LatestTransactionCard({ transactions, tickerData, rates, hidePrices }: Props) {
    const [latest, previous] = transactions

    if (!latest) {
        return (
            <Card aria-labelledby="latest-transaction-title" className="gap-3 p-5">
                <h2 id="latest-transaction-title" className="text-sm font-semibold">
                    Last transaction
                </h2>
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No transactions yet
                </p>
            </Card>
        )
    }

    const ticker = tickerData.find((td) => td.ticker === latest.ticker_id)
    const currency = ticker?.currency ?? Currency.EUR
    const flow = getTransactionFlow(latest, currency, rates)
    const lines = buildReceiptLines(latest, currency, ticker?.type)

    return (
        <Card aria-labelledby="latest-transaction-title" className="gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 id="latest-transaction-title" className="text-sm font-semibold">
                    Last transaction
                </h2>
                <Badge variant={TYPE_BADGE_VARIANT[latest.type]}>{TYPE_LABEL[latest.type]}</Badge>
            </div>

            <div className="flex flex-col gap-2">
                <p className="flex items-baseline gap-1.5">
                    <span
                        className={cn('text-3xl font-semibold tracking-tight tabular-nums', {
                            'text-success': flow.direction === TransactionDirection.In,
                            'blur-md select-none': hidePrices,
                        })}
                    >
                        {flow.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        · {formatDayMonth(latest.buy_date)}
                    </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border bg-muted/50 pr-2.5 pl-1 font-medium text-foreground">
                        <AssetLogo
                            logo={ticker?.logo}
                            ticker={latest.ticker_id}
                            className="size-5"
                        />
                        {latest.ticker_id}
                    </span>
                    <span>{currency}</span>
                </div>
            </div>

            <div className="flex flex-col">
                {/* Printer: the receipt slides out from under its slot */}
                <div className="relative z-10 h-5 rounded-xl bg-primary shadow-md">
                    <span
                        aria-hidden="true"
                        className="absolute top-1/2 right-4 size-1.5 -translate-y-1/2 rounded-full bg-success"
                    />
                </div>
                <div className="mx-3 -mt-2.5 drop-shadow-md">
                    <div className="receipt-edge flex flex-col gap-3 bg-card px-4 pt-6 text-xs">
                        <p className="flex items-center justify-center gap-1.5 font-medium">
                            <ReceiptTextIcon
                                aria-hidden="true"
                                className="size-3.5 text-muted-foreground"
                            />
                            {latest.ticker_id} · {toReceiptNumber(latest.id)}
                        </p>
                        <dl className="flex flex-col gap-2 border-y border-dashed py-3">
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">Date</dt>
                                <dd className="font-medium tabular-nums">
                                    {formatDateTime(latest.buy_date)}
                                </dd>
                            </div>
                            {lines.map((line) => (
                                <div key={line.label} className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">{line.label}</dt>
                                    <dd
                                        className={cn('text-right font-medium tabular-nums', {
                                            'blur-sm select-none': hidePrices && line.isAmount,
                                        })}
                                    >
                                        {line.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <div className="flex justify-between gap-3 text-sm font-semibold">
                            <span>Total (EUR)</span>
                            <span
                                className={cn('tabular-nums', {
                                    'blur-sm select-none': hidePrices,
                                })}
                            >
                                {flow.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    size="lg"
                    nativeButton={false}
                    render={<Link href={buildTransactionHref(latest.id)} />}
                >
                    Details
                </Button>
                <Button
                    size="lg"
                    nativeButton={false}
                    render={<Link href={TRANSACTIONS_ROUTE_PATH} />}
                >
                    All transactions
                </Button>
            </div>

            {previous && (
                <Link
                    href={buildTransactionHref(previous.id)}
                    className="mx-auto inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <HistoryIcon aria-hidden="true" className="size-3.5" />
                    Previous: {TYPE_LABEL[previous.type]} {previous.ticker_id}
                </Link>
            )}
        </Card>
    )
}
