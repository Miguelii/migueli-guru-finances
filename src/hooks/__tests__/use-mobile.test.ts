import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, act, useRef, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useIsMobile } from '@/hooks/use-mobile'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768

type MediaListener = (e: { matches: boolean }) => void

let listeners: MediaListener[] = []
const resultRef = { current: undefined as boolean | undefined }

function mockMatchMedia() {
    listeners = []
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: (_: string, cb: MediaListener) => {
            listeners.push(cb)
        },
        removeEventListener: (_: string, cb: MediaListener) => {
            listeners = listeners.filter((l) => l !== cb)
        },
    }))
}

function setWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
    })
}

function TestComponent() {
    const value = useIsMobile()
    const ref = useRef(resultRef)

    useEffect(function isMobileTestComponent() {
        ref.current.current = value
    })

    return null
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useIsMobile', () => {
    const originalMatchMedia = window.matchMedia
    const originalWidth = window.innerWidth
    let container: HTMLDivElement
    let root: Root

    beforeEach(() => {
        resultRef.current = undefined
        mockMatchMedia()
        container = document.createElement('div')
        document.body.append(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => root.unmount())
        container.remove()
        window.matchMedia = originalMatchMedia
        setWidth(originalWidth)
    })

    it.each([
        { width: 375, expected: true },
        { width: MOBILE_BREAKPOINT - 1, expected: true },
        { width: MOBILE_BREAKPOINT, expected: false },
        { width: 1024, expected: false },
    ])('should return $expected for width $width', ({ width, expected }) => {
        setWidth(width)
        act(() => root.render(createElement(TestComponent)))

        expect(resultRef.current).toBe(expected)
    })

    it('should react to media query changes', () => {
        setWidth(1024)
        act(() => root.render(createElement(TestComponent)))
        expect(resultRef.current).toBe(false)

        act(() => {
            setWidth(375)
            listeners.forEach((cb) => cb({ matches: true }))
        })
        expect(resultRef.current).toBe(true)
    })

    it('should clean up the listener on unmount', () => {
        setWidth(1024)
        act(() => root.render(createElement(TestComponent)))
        expect(listeners).toHaveLength(1)

        act(() => root.unmount())
        expect(listeners).toHaveLength(0)
    })
})
