import { useSyncExternalStore } from 'react'

// Tailwind `lg` breakpoint: below it the filters and details move into sheets
const LARGE_SCREEN_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
    const mql = window.matchMedia(LARGE_SCREEN_QUERY)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
}

export function useIsLargeScreen() {
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(LARGE_SCREEN_QUERY).matches,
        () => true
    )
}
