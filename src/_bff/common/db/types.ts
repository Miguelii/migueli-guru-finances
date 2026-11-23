import type { createDBServerClient } from '@/_bff/common/db/db.utils'

export type SbClient = Awaited<ReturnType<typeof createDBServerClient>>

export enum DBTables {
    DATA = 'data',
    TRANSACTIONS = 'transactions',
    BANK_CONNECTIONS = 'bank_connections',
    LOGS = 'logs',
    PORTFOLIO_SNAPSHOTS = 'portfolio_snapshots',
    // View: month-end row of portfolio_snapshots per user
    PORTFOLIO_SNAPSHOTS_MONTHLY = 'portfolio_snapshots_monthly',
}

// `logs` is shared with another app in the same Supabase project: rows are told apart by
// `project`, this app writes and reads only its own
export const LOGS_PROJECT = 'wallet'

export enum DBBuckets {
    PUBLIC_ASSETS = 'public_assets',
}
