import type { NavCounts } from '@/components/app-sidebar/app-sidebar.constants'
import type { HoldingSummary } from '@/types/Holding'
import type { TickerData, Transaction } from '@/types/Transaction'

export function buildNavHref(url: string, queryString: string) {
    return queryString.length > 0 ? `${url}?${queryString}` : url
}

export function getNavCounts(
    transactions: Transaction[],
    data: TickerData[],
    holdings: HoldingSummary[]
): NavCounts {
    return {
        positions: holdings.filter((h) => h.total_quantity > 0).length,
        transactions: transactions.length,
        watchlist: data.length,
    }
}
