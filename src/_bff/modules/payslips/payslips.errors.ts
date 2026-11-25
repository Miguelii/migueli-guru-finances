import { tagged } from '@/_bff/common/errors/shared.errors'

// The user already has a payslip for that year and month (UNIQUE (user_id, year, month))
export class PayslipMonthTakenError extends tagged('PayslipMonthTakenError') {}
