import type { User } from '@supabase/supabase-js'
import { z } from 'zod'
import type { CurrentUser } from '@/types/CurrentUser'

// Name fields an auth provider may set; any other shape is ignored instead of failing
const optionalName = z.string().trim().min(1).nullable().catch(null)

const nameMetadataSchema = z
    .object({ full_name: optionalName, name: optionalName, display_name: optionalName })
    .catch({ full_name: null, name: null, display_name: null })

/**
 * Builds the display data of the signed-in user: the first non-empty name found in the
 * auth metadata (`full_name`, then `name`, then `display_name`).
 *
 * @param user - The authenticated Supabase user.
 */
export function toCurrentUser(user: Pick<User, 'user_metadata'>): CurrentUser {
    const names = nameMetadataSchema.parse(user.user_metadata)

    return { name: names.full_name ?? names.name ?? names.display_name ?? null }
}
