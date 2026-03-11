import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
import { useSimulation } from '../../application/useSimulation.ts'

/**
 * Tests for useSimulation hook.
 *
 * --- WHY THIS FILE IS .tsx NOT .ts ---
 * Some tests need to render a real <canvas> element so React can attach
 * the canvasRef before the useEffect runs. JSX requires the .tsx extension.
 *
 * --- THE CORE PROBLEM: REFS AND renderHook ---
 * renderHook mounts a hook in isolation — it does NOT render a DOM tree.
 * The hook's canvasRef starts as null and stays null, because there is no
 * <canvas> element for React to attach it to.
 *
 * Inside useEffect, the hook checks:
 *   if (!canvas) return
 *
 * With no canvas in the DOM, the effect exits immediately — before calling
 * requestAnimationFrame. This is correct production behaviour (the hook
 * shouldn't crash if mounted without a canvas), but it means rAF tests
 * need a real canvas in the DOM.
 *
 * --- SOLUTION: TWO RENDERING STRATEGIES ---
 *
 * 1. renderHook — for testing pure state (isPaused, speed, controls).
 *    These tests don't need the animation loop to run. The canvas being
 *    null is irrelevant because they only interact with returned values.
 *
 * 2. render(<TestSimulator />) — for testing the animation loop.
 *    TestSimulator is a minimal component that renders a <canvas ref={canvasRef}>.
 *    React attaches the DOM element to the ref, the effect runs fully,
 *    and requestAnimationFrame gets called as expected.
 *
 * --- MOCKING HTMLCanvasElement.prototype.getContext ---
 * jsdom provides a <canvas> element but its getContext() returns null
 * (jsdom doesn't implement canvas rendering). We mock getContext on the
 * prototype so any canvas element created in tests returns our fake context.
 * This lets the effect proceed past the `if (!ctx) return` guard.
 */

// ---------------------------------------------------------------------------
// Mock canvas context
// ---------------------------------------------------------------------------

const mockCtx = {
    canvas:      { width: 100, height: 100 },
    fillRect:    vi.fn(),
    beginPath:   vi.fn(),
    arc:         vi.fn(),
    fill:        vi.fn(),
    stroke:      vi.fn(),
    moveTo:      vi.fn(),
    lineTo:      vi.fn(),
    fillStyle:   '',
    strokeStyle: '',
    lineWidth:   0,
} as unknown as CanvasRenderingContext2D

// ---------------------------------------------------------------------------
// rAF mock setup
// ---------------------------------------------------------------------------

let rafCallback: FrameRequestCallback | null = null
let rafIdCounter = 0

const mockRaf = vi.fn((callback: FrameRequestCallback): number => {
    rafCallback = callback
    return ++rafIdCounter
})

const mockCancelRaf = vi.fn()

function triggerFrame() {
    if (rafCallback) {
        rafCallback(performance.now())
    }
}

// ---------------------------------------------------------------------------
// Minimal test component
// ---------------------------------------------------------------------------

/**
 * TestSimulator renders a <canvas> and attaches the hook's canvasRef to it.
 *
 * This is the minimal scaffolding needed for the effect to run fully.
 * We don't need to expose controls from this component — the animation
 * loop tests only care that rAF was called, not about control values.
 */
function TestSimulator() {
    const { canvasRef } = useSimulation()
    return <canvas ref={canvasRef} width={100} height={100} />
}

// ---------------------------------------------------------------------------
// Test lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
    rafCallback   = null
    rafIdCounter  = 0
    mockRaf.mockClear()
    mockCancelRaf.mockClear()

    /**
     * Mock getContext on the HTMLCanvasElement prototype.
     * Every canvas element created in jsdom will now return our mockCtx
     * instead of null. We cast to `any` because TypeScript's overloads
     * for getContext are strict about the context type string.
     */
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
        mockCtx as any
    )

    vi.stubGlobal('requestAnimationFrame', mockRaf)
    vi.stubGlobal('cancelAnimationFrame', mockCancelRaf)
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSimulation', () => {

    describe('return shape', () => {
        it('returns a canvasRef', () => {
            const { result } = renderHook(() => useSimulation())
            expect(result.current.canvasRef).toBeDefined()
            expect(result.current.canvasRef).toHaveProperty('current')
        })

        it('returns isPaused as false initially', () => {
            const { result } = renderHook(() => useSimulation())
            expect(result.current.isPaused).toBe(false)
        })

        it('returns speed as 1 initially', () => {
            const { result } = renderHook(() => useSimulation())
            expect(result.current.speed).toBe(1)
        })

        it('returns togglePause as a function', () => {
            const { result } = renderHook(() => useSimulation())
            expect(typeof result.current.togglePause).toBe('function')
        })

        it('returns setSpeed as a function', () => {
            const { result } = renderHook(() => useSimulation())
            expect(typeof result.current.setSpeed).toBe('function')
        })
    })

    // -----------------------------------------------------------------------

    describe('pause control', () => {
        it('toggles isPaused to true when called once', () => {
            const { result } = renderHook(() => useSimulation())

            act(() => { result.current.togglePause() })

            expect(result.current.isPaused).toBe(true)
        })

        it('toggles isPaused back to false when called twice', () => {
            const { result } = renderHook(() => useSimulation())

            act(() => {
                result.current.togglePause()
                result.current.togglePause()
            })

            expect(result.current.isPaused).toBe(false)
        })

        it('isPaused reflects an odd number of toggles', () => {
            const { result } = renderHook(() => useSimulation())

            act(() => {
                result.current.togglePause() // true
                result.current.togglePause() // false
                result.current.togglePause() // true
            })

            expect(result.current.isPaused).toBe(true)
        })
    })

    // -----------------------------------------------------------------------

    describe('speed control', () => {
        it('updates speed when setSpeed is called', () => {
            const { result } = renderHook(() => useSimulation())

            act(() => { result.current.setSpeed(3) })

            expect(result.current.speed).toBe(3)
        })

        it('accepts fractional speed values', () => {
            const { result } = renderHook(() => useSimulation())

            act(() => { result.current.setSpeed(0.25) })

            expect(result.current.speed).toBe(0.25)
        })

        it('reflects the most recent setSpeed call', () => {
            const { result } = renderHook(() => useSimulation())

            act(() => {
                result.current.setSpeed(2)
                result.current.setSpeed(5)
                result.current.setSpeed(0.5)
            })

            expect(result.current.speed).toBe(0.5)
        })
    })

    // -----------------------------------------------------------------------

    describe('animation loop', () => {
        it('calls requestAnimationFrame on mount', () => {
            /**
             * render(<TestSimulator />) gives the hook a real <canvas> element.
             * React attaches it to canvasRef before the effect runs.
             * The effect proceeds past both null guards and calls rAF.
             *
             * contrast with renderHook: canvasRef.current stays null,
             * the effect returns early, rAF is never called.
             */
            render(<TestSimulator />)

            expect(mockRaf).toHaveBeenCalled()
        })

        it('calls requestAnimationFrame again after each frame', () => {
            render(<TestSimulator />)

            const callsAfterMount = mockRaf.mock.calls.length

            /**
             * triggerFrame() manually invokes the captured rAF callback,
             * simulating one animation frame firing. The loop body runs,
             * and at the end schedules the next frame with another rAF call.
             */
            act(() => { triggerFrame() })

            expect(mockRaf.mock.calls.length).toBeGreaterThan(callsAfterMount)
        })

        it('cancels the animation loop on unmount', () => {
            const { unmount } = render(<TestSimulator />)

            unmount()

            /**
             * React calls the useEffect cleanup on unmount.
             * Our cleanup calls cancelAnimationFrame(animationId).
             * Without this, the loop continues after the component is gone.
             */
            expect(mockCancelRaf).toHaveBeenCalled()
        })
    })
})