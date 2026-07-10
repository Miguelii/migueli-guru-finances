import 'server-only'

import { router } from '@/_trpc/server'
import { CREATE_TRANSACTION_PROTECTED_CONTROLLER } from './create-transaction/create-transaction.controller'
import { DELETE_TRANSACTION_PROTECTED_CONTROLLER } from './delete-transaction/delete-transaction.controller'
import { GET_ALL_TRANSACTIONS_PROTECTED_CONTROLLER } from './get-all-transactions/get-all-transactions.controller'
import { UPDATE_TRANSACTION_PROTECTED_CONTROLLER } from './update-transaction/update-transaction.controller'

export const TRANSACTIONS_ROUTER = router({
    getAll: GET_ALL_TRANSACTIONS_PROTECTED_CONTROLLER,
    create: CREATE_TRANSACTION_PROTECTED_CONTROLLER,
    update: UPDATE_TRANSACTION_PROTECTED_CONTROLLER,
    delete: DELETE_TRANSACTION_PROTECTED_CONTROLLER,
})
