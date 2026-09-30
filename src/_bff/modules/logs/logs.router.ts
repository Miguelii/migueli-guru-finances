import 'server-only'

import { router } from '@/_bff/trpc/server'
import { GET_LOGS_PROTECTED_CONTROLLER } from '@/_bff/modules/logs/get-logs/get-logs.controller'

export const LOGS_ROUTER = router({
    getAll: GET_LOGS_PROTECTED_CONTROLLER,
})
