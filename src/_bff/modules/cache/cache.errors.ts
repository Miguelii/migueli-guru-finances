import { tagged } from '@/_bff/common/errors/shared.errors'

export class DevOnlyActionError extends tagged('DevOnlyActionError') {}
