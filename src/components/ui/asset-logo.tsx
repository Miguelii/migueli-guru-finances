import Image from 'next/image'
import { buildLogoUrl, cn } from '@/lib/utils'
import type { TickerData } from '@/types/Transaction'

type Props = {
    logo: TickerData['logo']
    ticker: string
    className?: string
}

// Logo only (no label): falls back to the ticker initials when the asset has no logo
export function AssetLogo({ logo, ticker, className }: Props) {
    if (logo) {
        return (
            <Image
                src={buildLogoUrl(logo)}
                alt=""
                width={28}
                height={28}
                className={cn('size-7 shrink-0 rounded-none', className)}
                unoptimized
            />
        )
    }

    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex size-7 shrink-0 items-center justify-center bg-muted text-xs font-semibold text-muted-foreground',
                className
            )}
        >
            {ticker.slice(0, 2)}
        </span>
    )
}
