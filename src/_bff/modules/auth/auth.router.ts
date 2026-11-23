import 'server-only'

import { GET_CURRENT_USER_PROTECTED_CONTROLLER } from '@/_bff/modules/auth/get-current-user/get-current-user.controller'
import { LOGIN_PUBLIC_CONTROLLER } from '@/_bff/modules/auth/login/login.controller'
import { router } from '@/_bff/trpc/server'

export const AUTH_ROUTER = router({
    login: LOGIN_PUBLIC_CONTROLLER,
    me: GET_CURRENT_USER_PROTECTED_CONTROLLER,
})
