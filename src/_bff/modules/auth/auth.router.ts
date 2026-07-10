import 'server-only'

import { LOGIN_PUBLIC_CONTROLLER } from '@/_bff/modules/auth/login/login.controller'
import { router } from '@/_trpc/server'
import { SIGN_OUT_PROTECTED_CONTROLLER } from '@/_bff/modules/auth/sign-out/sign-out.controller'

export const AUTH_ROUTER = router({
    login: LOGIN_PUBLIC_CONTROLLER,
    signOut: SIGN_OUT_PROTECTED_CONTROLLER,
})
