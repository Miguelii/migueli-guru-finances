import type { User } from '@supabase/supabase-js'
import { Effect } from 'effect'
import { toCurrentUser } from '@/_bff/modules/auth/helpers/current-user.helper'

export const getCurrentUser = Effect.fn('getCurrentUser')(function* (user: User) {
    return yield* Effect.sync(() => toCurrentUser(user))
})
