/**
 * Builds a PostgREST `or` filter matching `search` as a literal, case-insensitive substring
 * of `message` or `prefix`. LIKE wildcards (`%`, `_`) are escaped and the value is quoted so
 * reserved characters (`,`, `(`, `)`) cannot break out of the filter.
 * @param search - Raw user search text (already trimmed, non-empty).
 */
export function buildLogSearchFilter(search: string): string {
    const pattern = `%${search.replaceAll(/[\\%_]/gu, String.raw`\$&`)}%`
    const quoted = `"${pattern.replaceAll(/["\\]/gu, String.raw`\$&`)}"`

    return `message.ilike.${quoted},prefix.ilike.${quoted}`
}
