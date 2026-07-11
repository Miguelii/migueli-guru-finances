import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/_trpc/router'

export const trpcClient = createTRPCReact<AppRouter>()
