export const PLANNING_TABS = ['house', 'projection'] as const

export type PlanningTab = (typeof PLANNING_TABS)[number]

export const DEFAULT_PLANNING_TAB: PlanningTab = 'house'
