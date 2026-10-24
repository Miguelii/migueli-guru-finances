import type * as React from 'react'

import {
    BriefcaseBusinessIcon,
    CircleDollarSignIcon,
    CoinsIcon,
    DatabaseZapIcon,
    LayoutDashboardIcon,
    LifeBuoyIcon,
    NewspaperIcon,
    ReceiptTextIcon,
    ScaleIcon,
    ScrollTextIcon,
    TrendingUpIcon,
    type LucideProps,
} from 'lucide-react'
import {
    CACHE_ROUTE_PATH,
    EMERGENCY_FUND_ROUTE_PATH,
    ETF_PLANNING_ROUTE_PATH,
    NEWS_ROUTE_PATH,
    PLANNING_ROUTE_PATH,
    LOGS_ROUTE_PATH,
    POSITIONS_ROUTE_PATH,
    PRICES_ROUTE_PATH,
    PRIVATE_ROUTE_PATH,
    STAKING_ROUTE_PATH,
    TRANSACTIONS_ROUTE_PATH,
} from '@/lib/constants'

type NavIcon = React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>

type NavItem = {
    title: string
    url: string
    Icon: NavIcon
}

export type NavGroup = {
    label?: string
    items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
    {
        items: [
            {
                title: 'Portfolio',
                url: PRIVATE_ROUTE_PATH,
                Icon: LayoutDashboardIcon,
            },
            {
                title: 'Transactions',
                url: TRANSACTIONS_ROUTE_PATH,
                Icon: ReceiptTextIcon,
            },
            {
                title: 'Positions',
                url: POSITIONS_ROUTE_PATH,
                Icon: BriefcaseBusinessIcon,
            },
            {
                title: 'Planning',
                url: PLANNING_ROUTE_PATH,
                Icon: TrendingUpIcon,
            },
            {
                title: 'ETF Planning',
                url: ETF_PLANNING_ROUTE_PATH,
                Icon: ScaleIcon,
            },
            {
                title: 'Staking',
                url: STAKING_ROUTE_PATH,
                Icon: CoinsIcon,
            },
            {
                title: 'Emergency Fund',
                url: EMERGENCY_FUND_ROUTE_PATH,
                Icon: LifeBuoyIcon,
            },
            {
                title: 'News',
                url: NEWS_ROUTE_PATH,
                Icon: NewspaperIcon,
            },
            {
                title: 'Watchlist',
                url: PRICES_ROUTE_PATH,
                Icon: CircleDollarSignIcon,
            },
        ],
    },
    {
        label: 'System',
        items: [
            {
                title: 'Logs',
                url: LOGS_ROUTE_PATH,
                Icon: ScrollTextIcon,
            },
        ],
    },
]

// Only added to the sidebar in development (the page 404s elsewhere)
export const DEV_NAV_GROUP: NavGroup = {
    label: 'Dev tools',
    items: [
        {
            title: 'Cache',
            url: CACHE_ROUTE_PATH,
            Icon: DatabaseZapIcon,
        },
    ],
}
