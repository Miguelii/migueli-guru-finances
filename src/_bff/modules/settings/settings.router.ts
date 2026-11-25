import 'server-only'

import { ADD_EXPENSE_PROTECTED_CONTROLLER } from '@/_bff/modules/settings/add-expense/add-expense.controller'
import { GET_SETTINGS_PROTECTED_CONTROLLER } from '@/_bff/modules/settings/get-settings/get-settings.controller'
import { REMOVE_EXPENSE_PROTECTED_CONTROLLER } from '@/_bff/modules/settings/remove-expense/remove-expense.controller'
import { UPDATE_SETTINGS_PROTECTED_CONTROLLER } from '@/_bff/modules/settings/update-settings/update-settings.controller'
import { router } from '@/_bff/trpc/server'

export const SETTINGS_ROUTER = router({
    get: GET_SETTINGS_PROTECTED_CONTROLLER,
    update: UPDATE_SETTINGS_PROTECTED_CONTROLLER,
    addExpense: ADD_EXPENSE_PROTECTED_CONTROLLER,
    removeExpense: REMOVE_EXPENSE_PROTECTED_CONTROLLER,
})
