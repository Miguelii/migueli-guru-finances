'use client'

import { ReceiptText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ASSET_TYPE_META } from '@/lib/constants/asset-types'
import {
    ALL_POSITION_TYPES,
    POSITION_SORT_KEYS,
    type PositionSortKey,
} from '@/lib/constants/positions'
import { cn } from '@/lib/utils'
import { POSITION_SORT_LABEL } from '@/modules/positions/positions.constants'
import type { PositionTypeFilter } from '@/modules/positions/positions.helpers'
import type { TickerType } from '@/types/Transaction'

type Props = {
    type: PositionTypeFilter
    availableTypes: TickerType[]
    sortKey: PositionSortKey
    includeFees: boolean
    onTypeChange: (type: PositionTypeFilter) => void
    onSortChange: (sortKey: PositionSortKey | null) => void
    onToggleFees: () => void
}

export function PositionsToolbar({
    type,
    availableTypes,
    sortKey,
    includeFees,
    onTypeChange,
    onSortChange,
    onToggleFees,
}: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
                value={type}
                onValueChange={(value) => onTypeChange(value as PositionTypeFilter)}
                className="min-w-0"
            >
                <TabsList className="rounded-none">
                    <TabsTrigger value={ALL_POSITION_TYPES} className="cursor-pointer rounded-none">
                        All
                    </TabsTrigger>
                    {availableTypes.map((assetType) => (
                        <TabsTrigger
                            key={assetType}
                            value={assetType}
                            className="cursor-pointer rounded-none"
                        >
                            {ASSET_TYPE_META[assetType].label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
                <Select value={sortKey} onValueChange={onSortChange} items={POSITION_SORT_LABEL}>
                    <SelectTrigger aria-label="Sort positions" className="h-8 min-w-36 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {POSITION_SORT_KEYS.map((key) => (
                            <SelectItem key={key} value={key} className="text-xs">
                                {POSITION_SORT_LABEL[key]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="sm"
                    aria-pressed={includeFees}
                    onClick={onToggleFees}
                    className={cn('h-8 cursor-pointer gap-1.5 text-xs', {
                        'border-foreground bg-accent': includeFees,
                    })}
                >
                    <ReceiptText />
                    Include fees
                </Button>
            </div>
        </div>
    )
}
