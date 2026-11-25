import 'server-only'

import { CREATE_PAYSLIP_PROTECTED_CONTROLLER } from '@/_bff/modules/payslips/create-payslip/create-payslip.controller'
import { DELETE_PAYSLIP_PROTECTED_CONTROLLER } from '@/_bff/modules/payslips/delete-payslip/delete-payslip.controller'
import { GET_PAYSLIPS_PROTECTED_CONTROLLER } from '@/_bff/modules/payslips/get-payslips/get-payslips.controller'
import { UPDATE_PAYSLIP_PROTECTED_CONTROLLER } from '@/_bff/modules/payslips/update-payslip/update-payslip.controller'
import { router } from '@/_bff/trpc/server'

export const PAYSLIPS_ROUTER = router({
    getAll: GET_PAYSLIPS_PROTECTED_CONTROLLER,
    create: CREATE_PAYSLIP_PROTECTED_CONTROLLER,
    update: UPDATE_PAYSLIP_PROTECTED_CONTROLLER,
    delete: DELETE_PAYSLIP_PROTECTED_CONTROLLER,
})
