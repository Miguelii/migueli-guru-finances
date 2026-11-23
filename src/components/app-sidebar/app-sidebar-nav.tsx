'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import {
    DEV_NAV_GROUP,
    NAV_GROUPS,
    type NavCounts,
    type NavGroup,
} from '@/components/app-sidebar/app-sidebar.constants'
import { buildNavHref } from '@/components/app-sidebar/app-sidebar.helpers'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type Props = {
    isDev: boolean
    counts: NavCounts
}

export function NavMain({ isDev, counts }: Props) {
    const groups: NavGroup[] = isDev ? [...NAV_GROUPS, DEV_NAV_GROUP] : NAV_GROUPS
    const sidebar = useSidebar()
    const isMobile = useIsMobile()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const onClick = useCallback(() => {
        if (isMobile) sidebar.toggleSidebar()
    }, [isMobile, sidebar])

    return (
        <>
            {groups.map((group, index) => (
                <SidebarGroup key={group.label ?? index} className="py-1">
                    {group.label && (
                        <SidebarGroupLabel className="text-muted-foreground">
                            {group.label}
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {group.items.map((item) => {
                                const Icon = item.Icon
                                const isActive = pathname === item.url
                                return (
                                    <Link
                                        key={item.title}
                                        className="contents"
                                        prefetch={true}
                                        href={buildNavHref(item.url, searchParams.toString())}
                                        onClick={() => onClick()}
                                    >
                                        <SidebarMenuItem>
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute top-1/2 -left-2 hidden h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand group-data-[collapsible=icon]:block"
                                                />
                                            )}
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                isActive={isActive}
                                                className={cn(
                                                    'h-9 cursor-pointer! gap-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground data-active:bg-brand/10 data-active:text-brand group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center [&_svg]:size-4.5',
                                                    {
                                                        'pr-10': item.countKey != null,
                                                    }
                                                )}
                                            >
                                                {Icon && <Icon />}
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                            {item.countKey != null && (
                                                <SidebarMenuBadge className="right-2 font-normal text-muted-foreground tabular-nums peer-data-[size=default]/menu-button:top-2">
                                                    {counts[item.countKey]}
                                                </SidebarMenuBadge>
                                            )}
                                        </SidebarMenuItem>
                                    </Link>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    )
}
