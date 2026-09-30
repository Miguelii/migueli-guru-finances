import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export const createContext = (opts: FetchCreateContextFnOptions) => {
    return Promise.resolve(opts)
}

export type Context = Awaited<ReturnType<typeof createContext>>
