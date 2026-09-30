import { externalUpdateTickers } from '@/_bff/modules/assets/external-update-tickers/external-update-tickers.service'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export function POST(request: NextRequest) {
    return externalUpdateTickers(request)
}
