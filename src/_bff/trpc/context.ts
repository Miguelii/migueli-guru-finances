import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = async (opts: FetchCreateContextFnOptions) => {
    return opts
}

export type Context = Awaited<ReturnType<typeof createContext>>
