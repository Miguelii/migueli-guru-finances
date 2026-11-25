export const GET_PAYSLIPS_CACHE_KEY = 'getPayslips'

export const GET_PAYSLIPS_REVALIDATE_TIME = 86400 // 24h, payslips only change through this app

// Postgres unique_violation: the user already has a payslip for that month
export const UNIQUE_VIOLATION_CODE = '23505'

/**
 * Builds the per-user cache tag for the payslips list, so a user's mutation only
 * invalidates their own cached entry.
 *
 * @param userId - Owner of the cached payslips list
 */
export const getPayslipsCacheTag = (userId: string) => `${GET_PAYSLIPS_CACHE_KEY}:${userId}`
