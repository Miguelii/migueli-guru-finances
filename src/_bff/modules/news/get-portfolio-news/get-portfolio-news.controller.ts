import { absurd } from 'effect/Function'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { newsTickersSchema } from '@/_bff/modules/news/news.dto'
import { getPortfolioNews } from '@/_bff/modules/news/get-portfolio-news/get-portfolio-news.service'

export const GET_PORTFOLIO_NEWS_PROTECTED_CONTROLLER = protectedProcedure
    .input(newsTickersSchema)
    .query(({ ctx, input }) =>
        // The service recovers from every failure (fewer items), so its error channel is
        // `never`: `absurd` stops compiling if a typed error is ever added without a mapping
        runEffect(getPortfolioNews(ctx.user.id, input), 'getPortfolioNews', absurd)
    )
