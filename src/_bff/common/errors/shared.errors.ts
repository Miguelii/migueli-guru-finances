import 'server-only'

import { type Cause, Data } from 'effect'
import type { ErrorCode } from './error-codes'

type TaggedErrorProps = { cause: unknown; message?: string; error_hash?: ErrorCode }

/**
 * Creates a tagged error class carrying an unknown `cause` and an optional `message`.
 *
 * The explicit constructor return type is required: without it, TypeScript leaves the
 * class `_tag` as the unsubstituted generic `T`, so `Match.tag` / `Effect.catchTag`
 * cannot discriminate the error union.
 *
 * @param tag - The unique tag identifying the error type.
 */
export const tagged = <T extends string>(
    tag: T
): new (
    args: TaggedErrorProps
) => Cause.YieldableError & { readonly _tag: T } & Readonly<TaggedErrorProps> =>
    Data.TaggedError(tag)<TaggedErrorProps>

export class CreateSbClientError extends tagged('CreateSbClientError') {}
export class SbQueryError extends tagged('SbQueryError') {}
