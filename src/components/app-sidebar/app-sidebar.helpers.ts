export function buildNavHref(url: string, queryString: string) {
    return queryString.length > 0 ? `${url}?${queryString}` : url
}
