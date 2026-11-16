/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = async (_opts?: FetchCreateContextFnOptions) => {
    return {}
}

export type Context = Awaited<ReturnType<typeof createContext>>
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
