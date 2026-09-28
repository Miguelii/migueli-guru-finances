import 'server-only'

import { GET_BANK_CONNECTION_PROTECTED_CONTROLLER } from '@/_bff/modules/bank/get-bank-connection/get-bank-connection.controller'
import { START_BANK_CONNECTION_PROTECTED_CONTROLLER } from '@/_bff/modules/bank/start-bank-connection/start-bank-connection.controller'
import { router } from '@/_bff/trpc/server'

export const BANK_ROUTER = router({
    get: GET_BANK_CONNECTION_PROTECTED_CONTROLLER,
    startConnection: START_BANK_CONNECTION_PROTECTED_CONTROLLER,
})
