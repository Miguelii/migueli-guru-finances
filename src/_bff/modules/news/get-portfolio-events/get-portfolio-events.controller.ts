import { absurd } from 'effect/Function'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { newsTickersSchema } from '@/_bff/modules/news/news.dto'
import { getPortfolioEvents } from '@/_bff/modules/news/get-portfolio-events/get-portfolio-events.service'

export const GET_PORTFOLIO_EVENTS_PROTECTED_CONTROLLER = protectedProcedure
    .input(newsTickersSchema)
    .query(({ ctx, input }) =>
        // The service recovers from every failure (fewer events), so its error channel is
        // `never`: `absurd` stops compiling if a typed error is ever added without a mapping
        runEffect(getPortfolioEvents(ctx.user.id, input), 'getPortfolioEvents', absurd)
    )
