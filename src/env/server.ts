import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod/mini'

export const ServerEnv = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production', 'test']),
        NEXT_SUPABASE_URL: z.string(),
        NEXT_SUPABASE_PUBLISHABLE_KEY: z.string(),
        NEXT_UPDATE_TICKERS_SECRET_KEY: z.string(),
        NEXT_SUPABASE_SERVICE_ROLE_KEY: z.string(),
    },
    runtimeEnv: {
        // NODE_ENV is automatically set by Node.js runtime
        NODE_ENV: process.env.NODE_ENV,

        NEXT_SUPABASE_URL: process.env.NEXT_SUPABASE_URL,
        NEXT_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_SUPABASE_PUBLISHABLE_KEY,
        NEXT_UPDATE_TICKERS_SECRET_KEY: process.env.NEXT_UPDATE_TICKERS_SECRET_KEY,
        NEXT_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY,
    },
})
