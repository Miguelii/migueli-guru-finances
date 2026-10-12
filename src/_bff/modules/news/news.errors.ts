import { tagged } from '@/_bff/common/errors/shared.errors'

export class GetYahooNewsError extends tagged('GetYahooNewsError') {}
export class GetYahooEventsError extends tagged('GetYahooEventsError') {}
export class GetYahooNamesError extends tagged('GetYahooNamesError') {}
export class GetGoogleNewsError extends tagged('GetGoogleNewsError') {}
// Every news source of an asset failed: nothing is cached, the next request retries
export class NewsSourcesUnavailableError extends tagged('NewsSourcesUnavailableError') {}
