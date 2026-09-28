import { generateKeyPairSync, createVerify } from 'node:crypto'
import { describe, it, expect, vi } from 'vitest'
import { signEnableBankingJwt } from '@/_bff/modules/bank/enable-banking-jwt.helper'

vi.mock('server-only', () => ({}))

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const decodePart = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))

describe('signEnableBankingJwt', () => {
    const token = signEnableBankingJwt('app-id-123', privateKey, 1_700_000_000)
    const [header, payload, signature] = token.split('.')

    it('should set the RS256 header with the application id as kid', () => {
        expect(decodePart(header!)).toEqual({ typ: 'JWT', alg: 'RS256', kid: 'app-id-123' })
    })

    it('should set the Enable Banking claims with a 1h expiry', () => {
        expect(decodePart(payload!)).toEqual({
            iss: 'enablebanking.com',
            aud: 'api.enablebanking.com',
            iat: 1_700_000_000,
            exp: 1_700_003_600,
        })
    })

    it('should produce a signature verifiable with the public key', () => {
        const isValid = createVerify('RSA-SHA256')
            .update(`${header}.${payload}`)
            .verify(publicKey, Buffer.from(signature!, 'base64url'))

        expect(isValid).toBe(true)
    })
})
