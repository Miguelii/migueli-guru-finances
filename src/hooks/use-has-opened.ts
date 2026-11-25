import { useState } from 'react'

/**
 * Latches to `true` the first time `open` is true, so a lazily loaded drawer is only mounted
 * once it is needed and then stays mounted to keep its close animation.
 * @param open the current open state of the drawer
 */
export function useHasOpened(open: boolean) {
    const [hasOpened, setHasOpened] = useState(open)

    if (open && !hasOpened) setHasOpened(true)

    return hasOpened || open
}
