import { externalUpdateTickers } from '@/_bff/modules/assets/external-update-tickers/external-update-tickers.service'
import { Effect } from 'effect'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const program = Effect.promise(() => externalUpdateTickers(request))
    return Effect.runPromise(program)
}
