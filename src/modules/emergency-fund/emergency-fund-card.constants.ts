import type { Badge } from '@/components/ui/badge'
import type { ComponentProps } from 'react'

// Show the renew button this many days before the PSD2 consent expires
export const CONSENT_EXPIRING_THRESHOLD_DAYS = 14

export const EmergencyFundStatus = {
    NotConfigured: 'NOT_CONFIGURED',
    NotConnected: 'NOT_CONNECTED',
    Ok: 'OK',
    Expiring: 'EXPIRING',
    Expired: 'EXPIRED',
    Error: 'ERROR',
    Unavailable: 'UNAVAILABLE',
} as const

export type EmergencyFundStatus = (typeof EmergencyFundStatus)[keyof typeof EmergencyFundStatus]

type BadgeVariant = ComponentProps<typeof Badge>['variant']

export const STATUS_BADGE: Record<EmergencyFundStatus, { label: string; variant: BadgeVariant }> = {
    [EmergencyFundStatus.NotConfigured]: { label: 'Not configured', variant: 'outline' },
    [EmergencyFundStatus.NotConnected]: { label: 'Not connected', variant: 'outline' },
    [EmergencyFundStatus.Ok]: { label: 'Connected', variant: 'success' },
    [EmergencyFundStatus.Expiring]: { label: 'Expires soon', variant: 'alert' },
    [EmergencyFundStatus.Expired]: { label: 'Expired', variant: 'destructive' },
    [EmergencyFundStatus.Error]: { label: 'Sync error', variant: 'destructive' },
    [EmergencyFundStatus.Unavailable]: { label: 'Unavailable', variant: 'destructive' },
}

// `null` hides the button (connection healthy, or nothing the user can fix from the UI)
export const CONNECT_BUTTON_LABEL: Record<EmergencyFundStatus, string | null> = {
    // Configuration lives in the environment (Enable Banking app), not in the app UI
    [EmergencyFundStatus.NotConfigured]: null,
    [EmergencyFundStatus.NotConnected]: 'Connect bank account',
    [EmergencyFundStatus.Ok]: null,
    [EmergencyFundStatus.Expiring]: 'Renew connection',
    [EmergencyFundStatus.Expired]: 'Renew connection',
    [EmergencyFundStatus.Error]: 'Reconnect',
    // Reconnecting does not help when the connection itself could not be read
    [EmergencyFundStatus.Unavailable]: null,
}

export const EMPTY_BALANCE_MESSAGE: Record<EmergencyFundStatus, string> = {
    [EmergencyFundStatus.NotConfigured]: 'Bank connection is not configured yet.',
    [EmergencyFundStatus.NotConnected]: 'Connect your bank account to track this balance.',
    [EmergencyFundStatus.Ok]: 'No balance synced yet.',
    [EmergencyFundStatus.Expiring]: 'No balance synced yet.',
    [EmergencyFundStatus.Expired]: 'No balance synced yet.',
    [EmergencyFundStatus.Error]: 'No balance synced yet.',
    [EmergencyFundStatus.Unavailable]: 'Could not load the balance. Please try again later.',
}

export const BANK_CONNECTION_TOAST = {
    connected: 'Bank account connected successfully!',
    error: 'Could not connect the bank account.',
} as const
