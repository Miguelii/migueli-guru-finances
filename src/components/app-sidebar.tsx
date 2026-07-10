'use client'

import * as React from 'react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import { CircleDollarSignIcon, LayoutDashboardIcon, type LucideProps } from 'lucide-react'
import Image from 'next/image'
import { PRICES_ROUTE_PATH, PRIVATE_ROUTE_PATH } from '@/lib/constants'
import Link from 'next/link'
import { SignOutApp } from '@/modules/auth/sign-out-app'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

type NavIcon = React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
>

type NavMain = {
    title: string
    url: string
    Icon: NavIcon
}

const data: { navMain: NavMain[] } = {
    navMain: [
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5! h-full">
                            <div className="flex items-center gap-2.5 h-full w-full">
                                <Image
                                    src="/assets/logo.webp"
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                    alt="Migueli Guru Finances Logo"
                                    unoptimized
                                />
                                <span className="text-base font-bold tracking-tight flex-wrap">
                                    Migueli Finances
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter className="p-3 flex flex-col gap-5">
                <Image
                    src="/assets/funny.webp"
                    width={280}
                    height={200}
                    className="w-full rounded-none"
                    alt="Vais ser pobre para sempre"
                    unoptimized
                    loading="eager"
                />
                <SignOutApp />
            </SidebarFooter>
        </Sidebar>
    )
}

function NavMain({ items }: { items: NavMain[] }) {
    const sidebar = useSidebar()
    const isMobile = useIsMobile()

    const searchParams = useSearchParams()

    const onClick = useCallback(() => {
        if (isMobile) sidebar.toggleSidebar()
    }, [isMobile, sidebar])

    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items?.map((item) => {
                        const Icon = item.Icon
                        return (
                            <Link
                                key={item.title}
                                className="contents"
                                prefetch={false}
                                href={`${item.url}?${searchParams.toString()}`}
                                onClick={() => onClick()}
                            >
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        className="cursor-pointer!"
                                    >
                                        {Icon && <Icon />}
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </Link>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
