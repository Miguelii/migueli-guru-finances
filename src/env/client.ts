import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod/mini'

export const ClientEnv = createEnv({
    client: {
        NEXT_PUBLIC_VERCEL_URL: z.string(),
    },
    runtimeEnv: {
        NEXT_PUBLIC_VERCEL_URL: process.env?.NEXT_PUBLIC_VERCEL_URL ?? undefined,
    },
})
