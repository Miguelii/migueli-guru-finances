'use client'

import { RefreshCwIcon, SearchIcon, SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { LOG_RANGE_LABEL, LOG_RANGES } from '@/lib/constants/logs'
import { cn } from '@/lib/utils'
import { useLogsToolbar } from '@/modules/logs/use-logs-toolbar'

type Props = {
    onOpenFilters: () => void
    hasFilters: boolean
}

export function LogsToolbar({ onOpenFilters, hasFilters }: Props) {
    const { range, search, isRefreshing, refresh, changeRange, changeSearch } = useLogsToolbar()

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => changeSearch(event.target.value)}
                    placeholder="Search messages and sources"
                    aria-label="Search logs"
                    className="h-8 pl-8 font-mono text-xs"
                />
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenFilters}
                    className={cn('h-8 cursor-pointer lg:hidden', {
                        'border-foreground': hasFilters,
                    })}
                >
                    <SlidersHorizontalIcon />
                    Filters
                </Button>
                <Select value={range} onValueChange={changeRange} items={LOG_RANGE_LABEL}>
                    <SelectTrigger aria-label="Time range" className="h-8 min-w-36 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {LOG_RANGES.map((value) => (
                            <SelectItem key={value} value={value} className="text-xs">
                                {LOG_RANGE_LABEL[value]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={refresh}
                    disabled={isRefreshing}
                    aria-label="Refresh logs"
                    className="size-8 cursor-pointer"
                >
                    <RefreshCwIcon
                        className={cn({ 'animate-spin motion-reduce:animate-none': isRefreshing })}
                    />
                </Button>
            </div>
        </div>
    )
}
