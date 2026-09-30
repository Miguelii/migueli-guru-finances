import 'server-only'

import { createSign } from 'node:crypto'
import { ENABLE_BANKING_JWT_TTL_SECONDS } from '@/_bff/modules/bank/bank.constants'

function toBase64UrlJson(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url')
}

/**
 * Signs the RS256 JWT that authenticates every Enable Banking API call.
 *
 * @param appId - Enable Banking application id, sent as the `kid` header
 * @param privateKey - PEM private key registered for that application
 * @param issuedAt - Issue time in seconds since epoch (defaults to now)
 */
export function signEnableBankingJwt(
    appId: string,
    privateKey: string,
    issuedAt = Math.floor(Date.now() / 1000)
): string {
    const header = toBase64UrlJson({ typ: 'JWT', alg: 'RS256', kid: appId })
    const payload = toBase64UrlJson({
        iss: 'enablebanking.com',
        aud: 'api.enablebanking.com',
        iat: issuedAt,
        exp: issuedAt + ENABLE_BANKING_JWT_TTL_SECONDS,
    })
    const signingInput = `${header}.${payload}`
    const signature = createSign('RSA-SHA256')
        .update(signingInput)
        .sign(privateKey)
        .toString('base64url')

    return `${signingInput}.${signature}`
}
