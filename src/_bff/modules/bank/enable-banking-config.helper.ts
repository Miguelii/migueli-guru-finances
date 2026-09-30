import 'server-only'

import { ServerEnv } from '@/env/server'
import { ClientEnv } from '@/env/client'

export type EnableBankingConfig = {
    appId: string
    privateKey: string
    // Bank (ASPSP) as named by Enable Banking. Kept in the env so the code never names it
    aspspName: string
    aspspCountry: string
    appUrl: string
}

const PEM_PREFIX = '-----BEGIN'
const PEM_PATTERN = /-----BEGIN ([A-Z ]+)-----([\s\S]+?)-----END \1-----/u
const PEM_LINE_LENGTH = 64

/**
 * Rebuilds a well-formed PEM from however the key was pasted into the env var: a
 * multi-line PEM, a single-line PEM with the line breaks stripped, a PEM with literal
 * `\n` sequences, or a base64-encoded PEM. OpenSSL rejects a PEM without its line breaks.
 *
 * @param rawKey - Private key as read from the environment
 */
export function toPrivateKeyPem(rawKey: string): string {
    const trimmed = rawKey.trim()
    const pem = trimmed.startsWith(PEM_PREFIX)
        ? trimmed
        : Buffer.from(trimmed, 'base64').toString('utf8')

    const match = PEM_PATTERN.exec(pem.replaceAll(String.raw`\n`, '\n'))

    if (!match) return pem

    const [, label, body = ''] = match
    const lines = Array.from(
        body.replaceAll(/\s+/gu, '').matchAll(new RegExp(`.{1,${PEM_LINE_LENGTH}}`, 'gu')),
        ([chunk]) => chunk
    )

    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`
}

/**
 * Reads the Enable Banking settings from the environment. Returns `null` while any of
 * them is missing, which keeps the whole bank feature disabled.
 */
export function getEnableBankingConfig(): EnableBankingConfig | null {
    const {
        ENABLE_BANKING_APP_ID: appId,
        ENABLE_BANKING_PRIVATE_KEY: rawPrivateKey,
        ENABLE_BANKING_ASPSP_NAME: aspspName,
        ENABLE_BANKING_ASPSP_COUNTRY: aspspCountry,
    } = ServerEnv

    const { NEXT_PUBLIC_VERCEL_URL: appUrl } = ClientEnv

    if (!appId || !rawPrivateKey || !aspspName || !aspspCountry || !appUrl) return null

    return {
        appId,
        privateKey: toPrivateKeyPem(rawPrivateKey),
        aspspName,
        aspspCountry,
        appUrl: appUrl.replace(/\/$/u, ''),
    }
}
