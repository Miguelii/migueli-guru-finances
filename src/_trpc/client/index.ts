import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@/_trpc/api'

export const trpcClient = createTRPCReact<AppRouter>()
