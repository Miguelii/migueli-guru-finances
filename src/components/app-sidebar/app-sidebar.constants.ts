import type * as React from 'react'

import {
    BanknoteIcon,
    BriefcaseBusinessIcon,
    CircleDollarSignIcon,
    DatabaseZapIcon,
    HandCoinsIcon,
    LayoutDashboardIcon,
    LifeBuoyIcon,
    NewspaperIcon,
    ReceiptTextIcon,
    ScaleIcon,
    ScrollTextIcon,
    SettingsIcon,
    TrendingUpIcon,
    type LucideProps,
} from 'lucide-react'
import {
    CACHE_ROUTE_PATH,
    EMERGENCY_FUND_ROUTE_PATH,
    ETF_PLANNING_ROUTE_PATH,
    EXPENSES_ROUTE_PATH,
    NEWS_ROUTE_PATH,
    PAYSLIPS_ROUTE_PATH,
    PLANNING_ROUTE_PATH,
    LOGS_ROUTE_PATH,
    POSITIONS_ROUTE_PATH,
    PRICES_ROUTE_PATH,
    PRIVATE_ROUTE_PATH,
    SETTINGS_ROUTE_PATH,
    TRANSACTIONS_ROUTE_PATH,
} from '@/lib/constants'

type NavIcon = React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>

type NavCountKey = 'positions' | 'transactions' | 'watchlist'

export type NavCounts = Record<NavCountKey, number>

type NavItem = {
    title: string
    url: string
    Icon: NavIcon
    countKey?: NavCountKey
}

export type NavGroup = {
    label?: string
    items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            {
                title: 'Portfolio',
                url: PRIVATE_ROUTE_PATH,
                Icon: LayoutDashboardIcon,
            },
            {
                title: 'Positions',
                url: POSITIONS_ROUTE_PATH,
                Icon: BriefcaseBusinessIcon,
                countKey: 'positions',
            },
            {
                title: 'Transactions',
                url: TRANSACTIONS_ROUTE_PATH,
                Icon: ReceiptTextIcon,
                countKey: 'transactions',
            },
            {
                title: 'Watchlist',
                url: PRICES_ROUTE_PATH,
                Icon: CircleDollarSignIcon,
                countKey: 'watchlist',
            },
            {
                title: 'News',
                url: NEWS_ROUTE_PATH,
                Icon: NewspaperIcon,
            },
        ],
    },
    {
        label: 'Planning',
        items: [
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
                title: 'Payslips',
                url: PAYSLIPS_ROUTE_PATH,
                Icon: BanknoteIcon,
            },
            {
                title: 'Expenses',
                url: EXPENSES_ROUTE_PATH,
                Icon: HandCoinsIcon,
            },
            {
                title: 'Emergency Fund',
                url: EMERGENCY_FUND_ROUTE_PATH,
                Icon: LifeBuoyIcon,
            },
        ],
    },
    {
        label: 'System',
        items: [
            {
                title: 'Settings',
                url: SETTINGS_ROUTE_PATH,
                Icon: SettingsIcon,
            },
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
