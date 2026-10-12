import { ArrowUpRightIcon, SearchIcon } from 'lucide-react'
import { AssetLogo } from '@/components/ui/asset-logo'
import { Badge } from '@/components/ui/badge'
import type { NewsItem } from '@/types/News'
import type { TickerData } from '@/types/Transaction'
import { formatNewsTime } from '@/modules/news/news-feed.helpers'

type Props = {
    item: NewsItem
    logo: TickerData['logo']
}

export function NewsRow({ item, logo }: Props) {
    return (
        <li>
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 px-3 py-3.5 transition-colors duration-150 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset motion-reduce:transition-none"
            >
                <AssetLogo logo={logo} ticker={item.ticker} className="mt-0.5 size-8" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="text-sm leading-snug font-medium text-pretty underline-offset-2 group-hover:underline">
                        {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <Badge variant="outline">{item.ticker}</Badge>
                        {item.fromKeywords && (
                            <Badge variant="secondary">
                                <SearchIcon aria-hidden="true" />
                                Your search
                            </Badge>
                        )}
                        <span className="min-w-0 truncate">{item.source}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={item.publishedAt} className="tabular-nums">
                            {formatNewsTime(item.publishedAt)}
                        </time>
                    </div>
                </div>
                <ArrowUpRightIcon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
                <span className="sr-only">(opens in a new tab)</span>
            </a>
        </li>
    )
}
