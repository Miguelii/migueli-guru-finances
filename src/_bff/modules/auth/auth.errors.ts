import 'server-only'

import { tagged } from '@/_bff/common/errors/shared.errors'

export class IsBotError extends tagged('IsBotError') {}
export class SignInWithPasswordError extends tagged('SignInWithPasswordError') {}
export class SignOutError extends tagged('SignOutError') {}
export class GetUserError extends tagged('GetUserError') {}
