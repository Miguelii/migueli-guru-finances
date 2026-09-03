import { Currency, TickerService, TickerType, type TickerData } from '@/types/Transaction'

export type AssetFormValues = {
    ticker: string
    type: TickerData['type']
    currency: Currency
    service: TickerData['service']
    symbol: TickerData['symbol']
    hex_color: string
    image: File | null
}

export const EMPTY_VALUES: AssetFormValues = {
    ticker: '',
    type: TickerType.Crypto,
    currency: Currency.EUR,
    service: TickerService.Coinbase,
    symbol: '€',
    hex_color: '',
    image: null,
}

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

export const ASSET_TYPES: TickerData['type'][] = [
    TickerType.Crypto,
    TickerType.Etf,
    TickerType.Stock,
    TickerType.Cambio,
]
export const SERVICES: TickerData['service'][] = [TickerService.Coinbase, TickerService.Yahoo]
export const SYMBOLS: TickerData['symbol'][] = ['€', '$', '€-$', '$-€']

/**
 * Reads a file as a base64 data URL (used to send the logo through the
 * JSON-only tRPC transport).
 *
 * @param file - The file selected in the form
 */
export function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => resolve(reader.result as string))
        reader.addEventListener('error', () =>
            reject(new Error('Failed to read file', { cause: reader.error }))
        )
        reader.readAsDataURL(file)
    })
}

/**
 * Maps a `data` table row to the drawer's form values (image always starts
 * empty — the current logo is kept unless a new file is chosen).
 *
 * @param asset - The asset row being edited
 */
export function toFormValues(asset: TickerData): AssetFormValues {
    return {
        ticker: asset.ticker,
        type: asset.type,
        currency: asset.currency,
        service: asset.service,
        symbol: asset.symbol,
        hex_color: asset.hex_color ?? '',
        image: null,
    }
}
