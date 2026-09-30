import { tagged } from '@/_bff/common/errors/shared.errors'

export class BankNotConfiguredError extends tagged('BankNotConfiguredError') {}
export class InvalidBankStateError extends tagged('InvalidBankStateError') {}
export class BankAccountNotFoundError extends tagged('BankAccountNotFoundError') {}
export class UnauthorizedSyncBankBalancesError extends tagged(
    'UnauthorizedSyncBankBalancesError'
) {}
// Enable Banking: consent expired/revoked, non-retryable request error, transient outage
export class EnableBankingConsentError extends tagged('EnableBankingConsentError') {}
export class EnableBankingRequestError extends tagged('EnableBankingRequestError') {}
export class EnableBankingUnavailableError extends tagged('EnableBankingUnavailableError') {}
// 429: the bank's daily PSD2 quota of unattended reads is used up (resets the next day)
export class EnableBankingRateLimitError extends tagged('EnableBankingRateLimitError') {}
