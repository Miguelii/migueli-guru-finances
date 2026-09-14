import 'server-only'

import { redirect } from 'next/navigation'
import { appRouter } from '@/_trpc/router'
import { createContext } from '@/_trpc/context'
import { FORCE_SIGN_OUT_API_PATH } from '@/lib/constants'

export const createCaller = async () => {
    const ctx = await createContext({} as any)
    return appRouter.createCaller(ctx, {
        // tRPC calls `onError` synchronously before rethrowing, so the NEXT_REDIRECT
        // thrown by `redirect()` propagates up to Next instead of the TRPCError.
        onError: ({ error }) => {
            if (error.code === 'UNAUTHORIZED') redirect(FORCE_SIGN_OUT_API_PATH)
        },
    })
}
