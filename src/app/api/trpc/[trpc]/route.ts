import { appRouter } from '@/_trpc/api'
import { createContext } from '@/_trpc/context'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const handler = (req: Request) =>
    fetchRequestHandler({
        router: appRouter,
        req,
        endpoint: '/api/trpc',
        createContext,
    })

export const GET = handler
export const POST = handler
