import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { updateTickers } from './update-tickers-prices.service'

export const UPDATE_TICKERS_PRICES_PROTECTED_CONTROLLER = protectedProcedure.mutation(() =>
    runEffect(updateTickers(), 'updateTickersPrices', (error) =>
        Match.value(error).pipe(
            Match.tag('IsBotError', () => 'FORBIDDEN' as const),
            Match.tag('UpdateTickersError', () => 'INTERNAL_SERVER_ERROR' as const),
            Match.exhaustive
        )
    )
)
