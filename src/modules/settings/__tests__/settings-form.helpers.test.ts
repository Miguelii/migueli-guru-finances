import { describe, expect, it } from 'vitest'
import { toSettingsFormValues, toSettingsPayload } from '@/modules/settings/settings-form.helpers'

describe('toSettingsFormValues', () => {
    it('keeps whole amounts plain and decimals with a comma', () => {
        expect(
            toSettingsFormValues({
                netMonthlySalaryEur: 2577.2,
                emergencyFundGoalEur: 5000,
            })
        ).toEqual({ netMonthlySalaryEur: '2577,20', emergencyFundGoalEur: '5000' })
    })

    it('leaves unset values empty', () => {
        expect(
            toSettingsFormValues({ netMonthlySalaryEur: null, emergencyFundGoalEur: null })
        ).toEqual({ netMonthlySalaryEur: '', emergencyFundGoalEur: '' })
    })
})

describe('toSettingsPayload', () => {
    it('parses both amounts', () => {
        expect(
            toSettingsPayload({ netMonthlySalaryEur: '2.577,20', emergencyFundGoalEur: '6000' })
        ).toEqual({ netMonthlySalaryEur: 2577.2, emergencyFundGoalEur: 6000 })
    })

    it('rejects an invalid salary or a zero goal', () => {
        expect(
            toSettingsPayload({ netMonthlySalaryEur: 'abc', emergencyFundGoalEur: '1' })
        ).toBeNull()
        expect(
            toSettingsPayload({ netMonthlySalaryEur: '100', emergencyFundGoalEur: '0' })
        ).toBeNull()
    })
})
