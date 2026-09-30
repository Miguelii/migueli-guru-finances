import { describe, it, expect } from 'vitest'
import { pickBalance } from '@/_bff/modules/bank/helpers/pick-balance.helper'

const balance = (balance_type: string, amount: string, currency = 'EUR') => ({
    balance_type,
    balance_amount: { amount, currency },
})

describe('pickBalance', () => {
    it('should prefer the interim available balance', () => {
        expect(
            pickBalance([
                balance('CLBD', '100.00'),
                balance('ITAV', '120.50'),
                balance('CLAV', '90'),
            ])
        ).toEqual({ amount: 120.5, currency: 'EUR' })
    })

    it('should follow the priority order when the preferred type is missing', () => {
        expect(pickBalance([balance('XPCD', '1'), balance('CLBD', '2')])).toEqual({
            amount: 2,
            currency: 'EUR',
        })
    })

    it('should fall back to the first usable balance of an unknown type', () => {
        expect(pickBalance([balance('OTHR', 'n/a'), balance('INFO', '5000.12', 'USD')])).toEqual({
            amount: 5000.12,
            currency: 'USD',
        })
    })

    it('should skip non-numeric amounts even for a preferred type', () => {
        expect(pickBalance([balance('ITAV', ''), balance('CLBD', '10')])).toEqual({
            amount: 10,
            currency: 'EUR',
        })
    })

    it('should return null for an empty list', () => {
        expect(pickBalance([])).toBeNull()
    })
})
