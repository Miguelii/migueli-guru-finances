'use client'

import { AssetLogo } from '@/components/ui/asset-logo'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ALL_TRANSACTION_ASSETS, ALL_TRANSACTION_TYPES } from '@/lib/constants/transactions'
import type { Ticker, TickerData, TransactionType } from '@/types/Transaction'
import { TYPE_LABEL } from '@/modules/transactions/transactions-card/transactions-card.constants'
import type { TransactionTypeFilter } from '@/modules/transactions/transactions-card/transactions-card.helpers'
import { TRANSACTION_TYPE_ORDER } from '@/modules/transactions/transactions-toolbar.constants'

type Props = {
    asset: string
    type: TransactionTypeFilter
    assets: Ticker[]
    availableTypes: TransactionType[]
    tickerMap: Map<Ticker, TickerData>
    onAssetChange: (asset: string | null) => void
    onTypeChange: (type: TransactionTypeFilter) => void
}

export function TransactionsToolbar({
    asset,
    type,
    assets,
    availableTypes,
    tickerMap,
    onAssetChange,
    onTypeChange,
}: Props) {
    const types = TRANSACTION_TYPE_ORDER.filter((value) => availableTypes.includes(value))
    const assetItems = [
        { value: ALL_TRANSACTION_ASSETS, label: 'All assets' },
        ...assets.map((ticker) => ({ value: ticker, label: ticker })),
    ]

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
                value={type}
                onValueChange={(value) => onTypeChange(value as TransactionTypeFilter)}
                className="min-w-0"
            >
                <TabsList className="rounded-none">
                    <TabsTrigger
                        value={ALL_TRANSACTION_TYPES}
                        className="cursor-pointer rounded-none"
                    >
                        All
                    </TabsTrigger>
                    {types.map((value) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            className="cursor-pointer rounded-none"
                        >
                            {TYPE_LABEL[value]}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <Select value={asset} onValueChange={onAssetChange} items={assetItems}>
                <SelectTrigger aria-label="Filter by asset" className="h-8 min-w-40 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {assetItems.map(({ value, label }) => (
                        <SelectItem key={value} value={value} className="text-xs">
                            <span className="flex items-center gap-2">
                                {value !== ALL_TRANSACTION_ASSETS && (
                                    <AssetLogo
                                        logo={tickerMap.get(value as Ticker)?.logo}
                                        ticker={value}
                                        className="size-4"
                                    />
                                )}
                                {label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
