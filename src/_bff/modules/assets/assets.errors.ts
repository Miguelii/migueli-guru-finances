import { tagged } from '@/_bff/common/errors/shared.errors'

export class GetCoinbasePriceError extends tagged('GetCoinbasePriceError') {}
export class GetFinancePriceError extends tagged('GetFinancePriceError') {}
export class UpdateTickersError extends tagged('UpdateTickersError') {}
export class UnauthorizedUpdateTickersError extends tagged('UnauthorizedUpdateTickersError') {}
export class UpdateTickersStatusError extends tagged('UpdateTickersStatusError') {}
export class UploadAssetImageError extends tagged('UploadAssetImageError') {}
export class GetAssetLogoError extends tagged('GetAssetLogoError') {}
