import 'server-only'

import { CREATE_ASSET_PROTECTED_CONTROLLER } from '@/_bff/modules/assets/create-asset/create-asset.controller'
import { DELETE_ASSET_PROTECTED_CONTROLLER } from '@/_bff/modules/assets/delete-asset/delete-asset.controller'
import { GET_ASSETS_PROTECTED_CONTROLLER } from '@/_bff/modules/assets/get-assets/get-assets.controller'
import { UPDATE_ASSET_PROTECTED_CONTROLLER } from '@/_bff/modules/assets/update-asset/update-asset.controller'
import { UPDATE_TICKERS_PRICES_PROTECTED_CONTROLLER } from '@/_bff/modules/assets/update-tickers-prices/update-tickers-prices.controller'
import { router } from '@/_trpc/server'

export const ASSETS_ROUTER = router({
    getAll: GET_ASSETS_PROTECTED_CONTROLLER,
    create: CREATE_ASSET_PROTECTED_CONTROLLER,
    update: UPDATE_ASSET_PROTECTED_CONTROLLER,
    delete: DELETE_ASSET_PROTECTED_CONTROLLER,
    updateTickersPrices: UPDATE_TICKERS_PRICES_PROTECTED_CONTROLLER,
})
