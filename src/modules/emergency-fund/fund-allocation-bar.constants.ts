import {
    EMERGENCY_FUND_GOAL,
    TOTAL_GOAL,
} from '@/modules/emergency-fund/emergency-fund-card.constants'

// Share of the bar taken by each bucket, proportional to its goal
export const FUND_SEGMENT_SHARE = (EMERGENCY_FUND_GOAL / TOTAL_GOAL) * 100

export const INSURANCE_SEGMENT_SHARE = 100 - FUND_SEGMENT_SHARE
