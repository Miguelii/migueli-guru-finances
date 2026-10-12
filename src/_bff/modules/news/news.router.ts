import 'server-only'

import { GET_PORTFOLIO_EVENTS_PROTECTED_CONTROLLER } from '@/_bff/modules/news/get-portfolio-events/get-portfolio-events.controller'
import { GET_PORTFOLIO_NEWS_PROTECTED_CONTROLLER } from '@/_bff/modules/news/get-portfolio-news/get-portfolio-news.controller'
import { router } from '@/_bff/trpc/server'

export const NEWS_ROUTER = router({
    get: GET_PORTFOLIO_NEWS_PROTECTED_CONTROLLER,
    getEvents: GET_PORTFOLIO_EVENTS_PROTECTED_CONTROLLER,
})
