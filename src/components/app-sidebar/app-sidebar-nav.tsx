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
                        <SidebarMenu className="gap-0.5">
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
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                isActive={isActive}
                                                className={cn(
                                                    'h-7 cursor-pointer! gap-2 hover:bg-foreground/4 data-active:bg-foreground/6 [&_svg]:size-3.5 [&_svg]:text-muted-foreground',
                                                    {
                                                        '[&_svg]:text-foreground': isActive,
                                                        'pr-10': item.countKey != null,
                                                    }
                                                )}
                                            >
                                                {Icon && <Icon />}
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                            {item.countKey != null && (
                                                <SidebarMenuBadge className="right-2 font-normal text-muted-foreground peer-data-[size=default]/menu-button:top-1">
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
