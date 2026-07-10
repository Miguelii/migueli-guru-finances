import 'server-only'

import { appRouter } from '@/_trpc/api'
import { createContext } from '@/_trpc/context'

export const createCaller = async () => {
    const ctx = await createContext({} as any)
    return appRouter.createCaller(ctx)
}
