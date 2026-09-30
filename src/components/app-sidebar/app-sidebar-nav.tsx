'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import {
    DEV_NAV_GROUP,
    NAV_GROUPS,
    type NavGroup,
} from '@/components/app-sidebar/app-sidebar.constants'
import { buildNavHref } from '@/components/app-sidebar/app-sidebar.helpers'
import { useIsMobile } from '@/hooks/use-mobile'

type Props = {
    isDev: boolean
}

export function NavMain({ isDev }: Props) {
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
                <SidebarGroup key={group.label ?? index}>
                    {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                    <SidebarGroupContent className="flex flex-col gap-2">
                        <SidebarMenu>
                            {group.items.map((item) => {
                                const Icon = item.Icon
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
                                                isActive={pathname === item.url}
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
            ))}
        </>
    )
}
