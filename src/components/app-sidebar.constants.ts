import type * as React from 'react'

import { CircleDollarSignIcon, LayoutDashboardIcon, type LucideProps } from 'lucide-react'
import { PRICES_ROUTE_PATH, PRIVATE_ROUTE_PATH } from '@/lib/constants'

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
                title: 'Watchlist',
                url: PRICES_ROUTE_PATH,
                Icon: CircleDollarSignIcon,
            },
        ],
    },
]
