import 'server-only'

import { LOGIN_PUBLIC_CONTROLLER } from '@/_bff/modules/auth/login/login.controller'
import { router } from '@/_trpc/server'

export const AUTH_ROUTER = router({
    login: LOGIN_PUBLIC_CONTROLLER,
})
