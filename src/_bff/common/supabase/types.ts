import type { createSbServerClient } from '@/_bff/common/supabase/supabase.client'

export type SbClient = Awaited<ReturnType<typeof createSbServerClient>>

export enum SbTables {
    DATA = 'data',
    TRANSACTIONS = 'transactions',
}

export enum SbBuckets {
    PUBLIC_ASSETS = 'public_assets',
}
