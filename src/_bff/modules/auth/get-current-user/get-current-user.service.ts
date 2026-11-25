import { Effect } from 'effect'
import type { SessionUser } from '@/_bff/modules/auth/helpers/get-session.helper'
import { toCurrentUser } from '@/_bff/modules/auth/helpers/current-user.helper'

export const getCurrentUser = Effect.fn('getCurrentUser')(function* (user: SessionUser) {
    return yield* Effect.sync(() => toCurrentUser(user))
})
