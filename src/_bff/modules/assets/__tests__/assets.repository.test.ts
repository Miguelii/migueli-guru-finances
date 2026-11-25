import { describe, expect, it, vi } from 'vitest'
import { updateAssetPrices } from '@/_bff/modules/assets/assets.repository'

vi.mock('server-only', () => ({}))

describe('updateAssetPrices', () => {
    it('sends every price in one rpc call', async () => {
        const rpc = vi.fn().mockResolvedValue({ error: null })
        await updateAssetPrices({ rpc }, [
            { ticker: 'BTC', price: 1 },
            { ticker: 'ETH', price: 2 },
        ])
        expect(rpc).toHaveBeenCalledTimes(1)
        expect(rpc).toHaveBeenCalledWith('update_ticker_prices', {
            prices: [
                { ticker: 'BTC', price: 1 },
                { ticker: 'ETH', price: 2 },
            ],
        })
    })
})
