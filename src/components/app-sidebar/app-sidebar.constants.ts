import type * as React from 'react'

import {
    BriefcaseBusinessIcon,
    CircleDollarSignIcon,
    DatabaseZapIcon,
    LayoutDashboardIcon,
    ReceiptTextIcon,
    ScrollTextIcon,
    type LucideProps,
} from 'lucide-react'
import {
    CACHE_ROUTE_PATH,
    LOGS_ROUTE_PATH,
    POSITIONS_ROUTE_PATH,
    PRICES_ROUTE_PATH,
    PRIVATE_ROUTE_PATH,
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
