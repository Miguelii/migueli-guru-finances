'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { AssetLogo } from '@/components/ui/asset-logo'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { paramsUrlKeys } from '@/lib/core/searchParams'
import { formatCurrency } from '@/lib/portfolio/formaters'
import { aggregateMonthlyPurchasesEur } from '@/lib/portfolio/transactions-summary'
import { cn } from '@/lib/utils'
import {
    Currency,
    type CambioRates,
    type Ticker,
    type TickerData,
    type Transaction,
} from '@/types/Transaction'
import { PortfolioCard } from '@/modules/portfolio-card/portfolio-card'
import {
    FIRST_YEAR,
    MONTH_LABELS,
} from '@/modules/monthly-purchases/monthly-purchases-card.constants'
import {
    buildChartConfig,
    buildChartData,
    buildChartSeries,
    buildYears,
} from '@/modules/monthly-purchases/monthly-purchases-card.helpers'

type Props = {
    transactions: Transaction[]
    tickerData: TickerData[]
    rates: CambioRates
    hidePrices: boolean
}

type KpiProps = {
    title: string
    children: React.ReactNode
}

const Kpi = ({ title, children }: KpiProps) => (
    <div className="flex min-w-0 flex-col gap-1">
        <dt className="text-xs text-muted-foreground">{title}</dt>
        <dd className="truncate text-sm font-semibold tabular-nums">{children}</dd>
    </div>
)

export function MonthlyPurchasesCard({ transactions, tickerData, rates, hidePrices }: Props) {
    const currentYear = new Date().getFullYear()

    // Filtered on the client from props: shallow skips the server re-render the adapter default triggers
    const [selectedYear, setSelectedYear] = useQueryState(
        paramsUrlKeys.filter_year!,
        parseAsInteger.withDefault(currentYear).withOptions({ shallow: true })
    )

    const tickerMap = new Map<Ticker, TickerData>(tickerData.map((td) => [td.ticker, td]))
    const purchases = aggregateMonthlyPurchasesEur(transactions, tickerData, rates, selectedYear)
    const series = buildChartSeries(purchases, tickerMap)
    const chartData = buildChartData(purchases, series)
    const blurClass = { 'blur-sm select-none': hidePrices }

    return (
        <PortfolioCard
            cardId="monthly-purchases"
            title="Monthly Purchases"
            className="min-w-0"
            openHeightClassName="h-auto"
            contentClassName="flex w-full flex-col gap-5"
            actions={
                <Select
                    value={String(selectedYear)}
                    onValueChange={(year) => setSelectedYear(Number(year))}
                >
                    <SelectTrigger className="w-24" aria-label="Select year">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {buildYears(FIRST_YEAR, currentYear).map((year) => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            }
        >
            {purchases.assets.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No purchases in {selectedYear}
                </p>
            ) : (
                <>
                    <dl className="grid grid-cols-3 gap-4 border-b pb-4">
                        <Kpi title={`Bought in ${selectedYear}`}>
                            <span className={cn(blurClass)}>
                                {formatCurrency(purchases.totalEur, Currency.EUR)}
                            </span>
                        </Kpi>
                        <Kpi title="Monthly average">
                            <span className={cn(blurClass)}>
                                {formatCurrency(purchases.avgEur, Currency.EUR)}
                            </span>
                        </Kpi>
                        <Kpi title="Best month">
                            {purchases.bestMonth && (
                                <>
                                    {MONTH_LABELS[purchases.bestMonth.month]}{' '}
                                    <span
                                        className={cn(
                                            'font-normal text-muted-foreground',
                                            blurClass
                                        )}
                                    >
                                        {formatCurrency(
                                            purchases.bestMonth.totalEur,
                                            Currency.EUR,
                                            0
                                        )}
                                    </span>
                                </>
                            )}
                        </Kpi>
                    </dl>

                    <figure>
                        <figcaption className="sr-only">
                            Purchases per month in {selectedYear}, stacked by asset, in euros
                        </figcaption>
                        <ChartContainer
                            config={buildChartConfig(series)}
                            className="aspect-auto h-56 w-full"
                        >
                            <BarChart
                                data={chartData}
                                margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    fontSize={11}
                                />
                                <YAxis hide />
                                {!hidePrices && (
                                    <ChartTooltip
                                        cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
                                        content={<ChartTooltipContent />}
                                    />
                                )}
                                {series.map(({ key, color }) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        name={key}
                                        stackId="purchases"
                                        fill={color}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </BarChart>
                        </ChartContainer>
                    </figure>

                    <ul className="flex flex-col divide-y border-t">
                        {purchases.assets.map((asset) => {
                            const ticker = tickerMap.get(asset.ticker)
                            return (
                                <li
                                    key={asset.ticker}
                                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_8rem_auto]"
                                >
                                    <span className="flex min-w-0 items-center gap-2.5">
                                        <AssetLogo logo={ticker?.logo} ticker={asset.ticker} />
                                        <span className="truncate font-semibold">
                                            {asset.ticker}
                                        </span>
                                    </span>
                                    <span className="order-last col-span-2 flex items-center gap-2 sm:order-none sm:col-span-1">
                                        <span className="h-1 flex-1 overflow-hidden bg-muted">
                                            <span
                                                className="block h-full"
                                                style={{
                                                    width: `${asset.share}%`,
                                                    backgroundColor: ticker?.hex_color,
                                                }}
                                            />
                                        </span>
                                        <span className="w-11 text-right text-xs text-muted-foreground tabular-nums">
                                            {asset.share.toFixed(1)}%
                                        </span>
                                    </span>
                                    <span className="flex flex-col items-end">
                                        <span className={cn('font-medium tabular-nums', blurClass)}>
                                            {formatCurrency(asset.totalEur, Currency.EUR)}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-xs text-muted-foreground tabular-nums',
                                                blurClass
                                            )}
                                        >
                                            {formatCurrency(asset.avgEur, Currency.EUR)} / month
                                        </span>
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </>
            )}
        </PortfolioCard>
    )
}
