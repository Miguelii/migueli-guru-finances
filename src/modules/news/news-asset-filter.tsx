'use client'

import { AssetLogo } from '@/components/ui/asset-logo'
import { ALL_NEWS_ASSETS } from '@/lib/constants/news'
import { cn } from '@/lib/utils'
import type { AssetFilterOption } from '@/modules/news/news-explorer.helpers'

type Props = {
    options: AssetFilterOption[]
    selected: string
    totalCount: number
    onChange: (ticker: string) => void
}

type ChipProps = {
    isActive: boolean
    count: number
    onClick: () => void
    children: React.ReactNode
}

const Chip = ({ isActive, count, onClick, children }: ChipProps) => (
    <button
        type="button"
        aria-pressed={isActive}
        onClick={onClick}
        className={cn(
            'inline-flex h-9 cursor-pointer items-center gap-2 border px-3 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
            {
                'border-primary bg-primary text-primary-foreground': isActive,
                'bg-card hover:bg-muted': !isActive,
            }
        )}
    >
        {children}
        <span
            className={cn('tabular-nums', {
                'text-primary-foreground/70': isActive,
                'text-muted-foreground': !isActive,
            })}
        >
            {count}
        </span>
    </button>
)

export function NewsAssetFilter({ options, selected, totalCount, onChange }: Props) {
    if (options.length < 2) return null

    return (
        <div role="group" aria-label="Filter by asset" className="flex flex-wrap gap-2">
            <Chip
                isActive={selected === ALL_NEWS_ASSETS}
                count={totalCount}
                onClick={() => onChange(ALL_NEWS_ASSETS)}
            >
                All assets
            </Chip>
            {options.map((option) => (
                <Chip
                    key={option.ticker}
                    isActive={selected === option.ticker}
                    count={option.newsCount}
                    onClick={() => onChange(option.ticker)}
                >
                    <AssetLogo logo={option.logo} ticker={option.ticker} className="size-4" />
                    {option.ticker}
                </Chip>
            ))}
        </div>
    )
}
