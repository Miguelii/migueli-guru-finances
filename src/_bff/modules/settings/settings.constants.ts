export const GET_USER_SETTINGS_CACHE_KEY = 'getUserSettings'

export const GET_USER_SETTINGS_REVALIDATE_TIME = 2_592_000 // 30 days, updates revalidate the tag anyway

// Keeps the JSON column small: a household budget never needs more lines than this
export const MAX_MONTHLY_EXPENSES = 100

/**
 * Builds the per-user cache tag for the settings row, so a user's update only invalidates
 * their own cached entry.
 *
 * @param userId - Owner of the cached settings
 */
export const getUserSettingsCacheTag = (userId: string) =>
    `${GET_USER_SETTINGS_CACHE_KEY}:${userId}`
