import {
    HOME_PAGE_PATH,
    PRIVATE_ROUTE_PATH,
    TRPC_API_PATH,
    UPDATE_TICKERS_API_PATH,
} from '@/lib/constants'
import { initBotId } from 'botid/client/core'

initBotId({
    protect: [
        {
            path: UPDATE_TICKERS_API_PATH,
            method: 'POST',
        },
        {
            path: `${TRPC_API_PATH}/*`,
            method: 'POST',
        },
        {
            path: PRIVATE_ROUTE_PATH,
            method: 'POST',
        },
        {
            path: HOME_PAGE_PATH,
            method: 'POST',
        },
    ],
})
