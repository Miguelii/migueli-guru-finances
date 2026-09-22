import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/_bff/trpc/router'

export const trpcClient = createTRPCReact<AppRouter>()
