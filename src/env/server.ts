import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod/mini'

export const ServerEnv = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production', 'test']),
        NEXT_SUPABASE_URL: z.string(),
        NEXT_SUPABASE_PUBLISHABLE_KEY: z.string(),
        NEXT_UPDATE_TICKERS_SECRET_KEY: z.string(),
        NEXT_SUPABASE_SERVICE_ROLE_KEY: z.string(),
        // Enable Banking (bank balance). Optional: the feature stays off until all are set
        ENABLE_BANKING_APP_ID: z.optional(z.string()),
        ENABLE_BANKING_ASPSP_NAME: z.optional(z.string()),
        ENABLE_BANKING_PRIVATE_KEY: z.optional(z.string()),
        ENABLE_BANKING_ASPSP_COUNTRY: z.optional(z.string()),
        NEXT_SYNC_BANK_SECRET_KEY: z.optional(z.string()),
    },
    runtimeEnv: {
        // NODE_ENV is automatically set by Node.js runtime
        NODE_ENV: process.env.NODE_ENV,

        NEXT_SUPABASE_URL: process.env.NEXT_SUPABASE_URL,
        NEXT_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_SUPABASE_PUBLISHABLE_KEY,
        NEXT_UPDATE_TICKERS_SECRET_KEY: process.env.NEXT_UPDATE_TICKERS_SECRET_KEY,
        NEXT_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY,
        ENABLE_BANKING_APP_ID: process.env.ENABLE_BANKING_APP_ID,
        ENABLE_BANKING_ASPSP_NAME: process.env.ENABLE_BANKING_ASPSP_NAME,
        ENABLE_BANKING_PRIVATE_KEY: process.env.ENABLE_BANKING_PRIVATE_KEY,
        ENABLE_BANKING_ASPSP_COUNTRY: process.env.ENABLE_BANKING_ASPSP_COUNTRY,
        NEXT_SYNC_BANK_SECRET_KEY: process.env.NEXT_SYNC_BANK_SECRET_KEY,
    },
})
