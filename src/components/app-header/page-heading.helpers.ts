import { DEV_NAV_GROUP, NAV_GROUPS } from '@/components/app-sidebar/app-sidebar.constants'
import { PRIVATE_ROUTE_PATH } from '@/lib/constants'

/**
 * Title of the page at `pathname`, taken from the sidebar navigation. Returns `null` for
 * the dashboard (it renders its own greeting) and for routes outside the navigation.
 *
 * @param pathname - Current URL pathname.
 */
export function getPageTitle(pathname: string): string | null {
    if (pathname === PRIVATE_ROUTE_PATH) return null

    const item = [...NAV_GROUPS, DEV_NAV_GROUP]
        .flatMap((group) => group.items)
        .find((navItem) => navItem.url === pathname)

    return item?.title ?? null
}
