'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker for PWA support.
 * Must be rendered as a client component in the root layout.
 */
export function ServiceWorkerRegister() {
    useEffect(function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
        }
    }, [])

    return null
}
