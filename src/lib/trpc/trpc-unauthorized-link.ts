import type { TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import type { AppRouter } from '@/_bff/trpc/router'
import { FORCE_SIGN_OUT_API_PATH } from '@/lib/constants'

let isRedirecting = false

/**
 * Forces a sign-out when any procedure responds with UNAUTHORIZED (invalid session).
 * Uses a hard navigation so React Query and RSC state are discarded; batched calls
 * trigger the redirect only once. The error is still forwarded to the caller.
 */
export const unauthorizedLink: TRPCLink<AppRouter> =
    () =>
    ({ next, op }) =>
        observable((observer) =>
            next(op).subscribe({
                next: (value) => observer.next(value),
                error: (error) => {
                    if (error.data?.code === 'UNAUTHORIZED' && !isRedirecting) {
                        isRedirecting = true
                        window.location.assign(FORCE_SIGN_OUT_API_PATH)
                    }
                    observer.error(error)
                },
                complete: () => observer.complete(),
            })
        )
