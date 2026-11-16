import { Predicate } from 'effect'

export function isTimestamp(value: unknown): value is number {
    return Predicate.isNumber(value)
}
