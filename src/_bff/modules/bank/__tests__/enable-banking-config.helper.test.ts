import { createPrivateKey, generateKeyPairSync } from 'node:crypto'
import { describe, it, expect, vi } from 'vitest'
import { toPrivateKeyPem } from '@/_bff/modules/bank/enable-banking-config.helper'

vi.mock('server-only', () => ({}))
vi.mock('@/env/server', () => ({ ServerEnv: {} }))
vi.mock('@/env/client', () => ({ ClientEnv: {} }))

const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const isParsable = (pem: string) => {
    try {
        createPrivateKey(pem)
        return true
    } catch {
        return false
    }
}

describe('toPrivateKeyPem', () => {
    it('should keep a well-formed multi-line PEM parsable', () => {
        expect(toPrivateKeyPem(privateKey)).toBe(privateKey)
    })

    it('should rebuild a single-line PEM with the line breaks stripped', () => {
        const singleLine = privateKey.replaceAll('\n', '')

        expect(isParsable(singleLine)).toBe(false)
        expect(toPrivateKeyPem(singleLine)).toBe(privateKey)
    })

    it('should rebuild a PEM with literal \\n sequences', () => {
        expect(toPrivateKeyPem(privateKey.replaceAll('\n', String.raw`\n`))).toBe(privateKey)
    })

    it('should decode a base64-encoded PEM', () => {
        expect(toPrivateKeyPem(Buffer.from(privateKey).toString('base64'))).toBe(privateKey)
    })
})
