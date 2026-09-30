import type { createDBServerClient } from '@/_bff/common/db/db.utils'

export type SbClient = Awaited<ReturnType<typeof createDBServerClient>>

export enum DBTables {
    DATA = 'data',
    TRANSACTIONS = 'transactions',
    BANK_CONNECTIONS = 'bank_connections',
    LOGS = 'logs',
}

export enum DBBuckets {
    PUBLIC_ASSETS = 'public_assets',
}
