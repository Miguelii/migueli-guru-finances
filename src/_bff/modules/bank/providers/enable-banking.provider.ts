import 'server-only'

import { Effect, Schedule } from 'effect'
import { z } from 'zod'
import { ErrorCode } from '@/_bff/common/errors/error-codes'
import { ENABLE_BANKING_API_URL } from '@/_bff/modules/bank/bank.constants'
import type { EnableBankingConfig } from '@/_bff/modules/bank/helpers/enable-banking-config.helper'
import { signEnableBankingJwt } from '@/_bff/modules/bank/helpers/enable-banking-jwt.helper'
import {
    EnableBankingConsentError,
    EnableBankingRateLimitError,
    EnableBankingRequestError,
    EnableBankingUnavailableError,
} from '@/_bff/modules/bank/bank.errors'

const authorizationResponseSchema = z.object({ url: z.string().min(1) })

const sessionResponseSchema = z.object({
    session_id: z.string().min(1),
    accounts: z.array(z.object({ uid: z.string().min(1) })),
    access: z.object({ valid_until: z.string().min(1) }),
})

const balancesResponseSchema = z.object({
    balances: z.array(
        z.object({
            balance_type: z.string(),
            balance_amount: z.object({ amount: z.string(), currency: z.string() }),
        })
    ),
})

const errorBodySchema = z.object({
    code: z.string().optional(),
    error: z.string().optional(),
    error_code: z.string().optional(),
})

type EnableBankingError =
    | EnableBankingConsentError
    | EnableBankingRateLimitError
    | EnableBankingRequestError
    | EnableBankingUnavailableError

type RequestOptions<S extends z.ZodType> = {
    path: string
    schema: S
    errorHash: ErrorCode
    body?: object
}

const CONSENT_ERROR_STATUSES = new Set([401, 403])
const RATE_LIMIT_STATUS = 429
const CONSENT_ERROR_CODE_PATTERN = /SESSION|CONSENT/iu

/**
 * Same retry policy as the ticker price providers (~2s → ~4s, max 2 retries), applied
 * only to transient failures (network errors, 5xx).
 */
const retryPolicy = Schedule.exponential('2 second').pipe(
    Schedule.jittered,
    Schedule.intersect(Schedule.recurs(2))
)

/**
 * Whether a failed response means the PSD2 consent is no longer usable (expired,
 * revoked or closed session). Enable Banking forwards bank-specific codes, so besides
 * 401/403 any error code mentioning the session or consent counts.
 *
 * @param status - HTTP status of the failed response
 * @param body - Raw response body
 */
function isConsentFailure(status: number, body: string): boolean {
    if (CONSENT_ERROR_STATUSES.has(status)) return true

    try {
        const parsed = errorBodySchema.safeParse(JSON.parse(body))
        if (!parsed.success) return false

        const { code, error, error_code } = parsed.data
        return [code, error, error_code].some(
            (value) => value !== undefined && CONSENT_ERROR_CODE_PATTERN.test(value)
        )
    } catch {
        return false
    }
}

function requestEnableBanking<S extends z.ZodType>(
    config: EnableBankingConfig,
    { path, schema, errorHash, body }: RequestOptions<S>
): Effect.Effect<z.infer<S>, EnableBankingError> {
    return Effect.gen(function* () {
        const token = yield* Effect.try({
            try: () => signEnableBankingJwt(config.appId, config.privateKey),
            catch: (cause) =>
                new EnableBankingRequestError({
                    cause,
                    message: 'Invalid Enable Banking private key',
                    error_hash: errorHash,
                }),
        })

        const response = yield* Effect.tryPromise({
            try: () =>
                fetch(`${ENABLE_BANKING_API_URL}${path}`, {
                    method: body ? 'POST' : 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    cache: 'no-store',
                }),
            catch: (cause) => new EnableBankingUnavailableError({ cause, error_hash: errorHash }),
        })

        if (!response.ok) {
            const responseBody = yield* Effect.promise(() => response.text().catch(() => ''))
            const cause = { status: response.status, path, body: responseBody }

            if (response.status === RATE_LIMIT_STATUS) {
                return yield* new EnableBankingRateLimitError({ cause, error_hash: errorHash })
            }

            if (isConsentFailure(response.status, responseBody)) {
                return yield* new EnableBankingConsentError({ cause, error_hash: errorHash })
            }

            if (response.status >= 500) {
                return yield* new EnableBankingUnavailableError({ cause, error_hash: errorHash })
            }

            return yield* new EnableBankingRequestError({ cause, error_hash: errorHash })
        }

        const json = yield* Effect.tryPromise({
            try: () => response.json(),
            catch: (cause) => new EnableBankingRequestError({ cause, error_hash: errorHash }),
        })

        const parsed = schema.safeParse(json)

        if (!parsed.success) {
            return yield* new EnableBankingRequestError({
                cause: parsed.error,
                message: `Unexpected response shape for ${path}`,
                error_hash: errorHash,
            })
        }

        return parsed.data
    })
}

export function startAuthorization(
    config: EnableBankingConfig,
    props: { state: string; validUntil: string; redirectUrl: string }
) {
    return requestEnableBanking(config, {
        path: '/auth',
        schema: authorizationResponseSchema,
        errorHash: ErrorCode.BANK_AUTH_REQUEST,
        body: {
            access: { valid_until: props.validUntil },
            aspsp: { name: config.aspspName, country: config.aspspCountry },
            state: props.state,
            redirect_url: props.redirectUrl,
            psu_type: 'personal',
        },
    })
}

// Not retried: the authorization code is single-use
export function createSession(config: EnableBankingConfig, code: string) {
    return requestEnableBanking(config, {
        path: '/sessions',
        schema: sessionResponseSchema,
        errorHash: ErrorCode.BANK_SESSION_REQUEST,
        body: { code },
    })
}

export function getAccountBalances(config: EnableBankingConfig, accountUid: string) {
    return requestEnableBanking(config, {
        path: `/accounts/${encodeURIComponent(accountUid)}/balances`,
        schema: balancesResponseSchema,
        errorHash: ErrorCode.BANK_BALANCES_REQUEST,
    }).pipe(
        Effect.retry({
            schedule: retryPolicy,
            while: (error) => error._tag === 'EnableBankingUnavailableError',
        }),
        Effect.map(({ balances }) => balances)
    )
}
