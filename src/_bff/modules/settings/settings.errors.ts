import { tagged } from '@/_bff/common/errors/shared.errors'

// The expense list already holds MAX_MONTHLY_EXPENSES items
export class ExpenseLimitReachedError extends tagged('ExpenseLimitReachedError') {}
