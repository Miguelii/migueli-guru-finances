import { appRouter } from '@/_bff/trpc/router'
import { createContext } from '@/_bff/trpc/context'
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
