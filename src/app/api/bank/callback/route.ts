import { Effect } from 'effect'
import { type NextRequest } from 'next/server'
import { bankCallback } from '@/_bff/modules/bank/bank-callback/bank-callback.service'

export const dynamic = 'force-dynamic'

// GET: Enable Banking redirects the browser here after the user authorizes the bank
export function GET(request: NextRequest) {
    return Effect.runPromise(bankCallback(request))
}
