import { Effect } from 'effect'
import { type NextRequest } from 'next/server'
import { externalSyncBankBalances } from '@/_bff/modules/bank/external-sync-bank-balances/external-sync-bank-balances.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    return Effect.runPromise(externalSyncBankBalances(request))
}
