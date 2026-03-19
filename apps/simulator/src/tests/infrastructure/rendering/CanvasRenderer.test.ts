import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CanvasRenderer } from '../../../infrastructure/rendering/CanvasRenderer.ts'
import { Vector2 } from '../../../core/math/Vector2.ts'
import type { CelestialBody } from '../../../core/models/CelestialBody.ts'

/**
 * Tests for CanvasRenderer.
 *
 * --- TESTING STRATEGY: MOCKING THE CANVAS CONTEXT ---
 *
 * CanvasRenderer depends on CanvasRenderingContext2D, a browser API that
 * doesn't exist in Node (our test environment). We solve this by creating
 * a fake context object where every method is a vi.fn() spy.
 *
 * vi.fn() creates a mock function that:
 *   - Does nothing by default (returns undefined)
 *   - Records every call: how many times, with what arguments
 *   - Can be inspected via .mock.calls, .mock.results, toHaveBeenCalled(), etc.
 *
 * We then pass this fake context to CanvasRenderer's constructor.
 * CanvasRenderer cannot tell the difference — it just calls methods on
 * whatever object it receives. This is a practical demonstration of why
 * depending on interfaces rather than concrete implementations makes
 * code testable.
 *
 * After calling draw(), we inspect the spies to verify the renderer made
 * the correct sequence of decisions, without needing a real browser.
 *
 * --- STRUCTURE ---
 * Each test is self-contained: it creates its own bodies, trails, and
 * (where needed) a fresh mock context. The shared mockCtx in beforeEach
 * is reset between tests so spy call counts don't bleed across tests.
 */

// ---------------------------------------------------------------------------
// Mock context factory
// ---------------------------------------------------------------------------

/**
 * Creates a mock CanvasRenderingContext2D.
 *
 * We cast to `unknown` first then to the target type — this is the TypeScript
 * pattern for "I know this doesn't fully implement the interface, but for the
 * purposes of this test, these are the only methods that will be called."
 *
 * The canvas property is needed because CanvasRenderer reads
 * ctx.canvas.width and ctx.canvas.height to calculate the centre point.
 */
function createMockContext(width = 1000, height = 1000) {
    return {
        canvas:      { width, height },
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
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const makeSun = (): CelestialBody => ({
    id:       'sun',
    mass:     1.989e30,
    position: new Vector2(0, 0),
    velocity: new Vector2(0, 0),
})

const makeEarth = (): CelestialBody => ({
    id:       'earth',
    mass:     5.972e24,
    position: new Vector2(1.496e11, 0),
    velocity: new Vector2(0, 0),
})

const makeMars = (): CelestialBody => ({
    id:       'mars',
    mass:     6.39e23,
    position: new Vector2(2.279e11, 0),
    velocity: new Vector2(0, 0),
})

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Returns a Map with an empty trail for each body.
 * Mirrors the initial state of trailsRef in useSimulation.
 */
function emptyTrails(bodies: CelestialBody[]): Map<string, Vector2[]> {
    return new Map(bodies.map(b => [b.id, []]))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CanvasRenderer', () => {

    let mockCtx: CanvasRenderingContext2D
    let renderer: CanvasRenderer

    /**
     * beforeEach runs before every individual test in this describe block.
     * Creating a fresh context here ensures spy call counts from one test
     * don't affect assertions in the next.
     */
    beforeEach(() => {
        mockCtx  = createMockContext()
        renderer = new CanvasRenderer(mockCtx)
    })

    // -----------------------------------------------------------------------

    describe('background', () => {
        it('clears the canvas on every draw call', () => {
            renderer.draw([], new Map(), 1)

            /**
             * toHaveBeenCalledWith() asserts the spy was called with specific args.
             * fillRect(0, 0, width, height) covers the entire canvas —
             * this is the clear/background operation.
             */
            expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 1000, 1000)
        })

        it('draws the background before any bodies', () => {
            /**
             * vi.fn() records all calls in .mock.invocationCallOrder —
             * a monotonically increasing counter across ALL mocks in the test.
             *
             * By comparing invocation order numbers, we can assert that
             * fillRect happened before arc without caring about exact call counts.
             */
            const sun = makeSun()
            renderer.draw([sun], emptyTrails([sun]), 1)

            const fillRectOrder = (mockCtx.fillRect as ReturnType<typeof vi.fn>)
                .mock.invocationCallOrder[0]
            const arcOrder = (mockCtx.arc as ReturnType<typeof vi.fn>)
                .mock.invocationCallOrder[0]

            expect(fillRectOrder).toBeLessThan(arcOrder)
        })
    })

    // -----------------------------------------------------------------------

    describe('body rendering', () => {
        it('calls arc once per body with no trails', () => {
            /**
             * With three bodies and no trails, we expect one arc() call per
             * body for the main circle — BUT the sun also gets a second arc()
             * for its glow effect.
             *
             * So: 1 (sun body) + 1 (sun glow) + 1 (earth) + 1 (mars) = 4
             */
            const bodies = [makeSun(), makeEarth(), makeMars()]
            renderer.draw(bodies, emptyTrails(bodies), 1)

            expect(mockCtx.arc).toHaveBeenCalledTimes(4)
        })

        it('calls arc once for a non-stellar body (no glow)', () => {
            const earth = makeEarth()
            renderer.draw([earth], emptyTrails([earth]), 1)

            expect(mockCtx.arc).toHaveBeenCalledTimes(1)
        })

        it('calls arc twice for a stellar body (body + glow)', () => {
            const sun = makeSun()
            renderer.draw([sun], emptyTrails([sun]), 1)

            expect(mockCtx.arc).toHaveBeenCalledTimes(2)
        })

        it('positions the body at the canvas centre when at origin', () => {
            /**
             * The sun is at position (0, 0) in simulation space.
             * The canvas is 1000x1000, so centre is (500, 500).
             * Scale doesn't matter — 0 * anything = 0.
             *
             * arc args: arc(centerX, centerY, radius, startAngle, endAngle)
             * We check only x and y (args[0] and [1]).
             */
            const sun = makeSun()
            renderer.draw([sun], emptyTrails([sun]), 1)

            const arcCalls = (mockCtx.arc as ReturnType<typeof vi.fn>).mock.calls
            const [x, y] = arcCalls[0]

            expect(x).toBe(500)
            expect(y).toBe(500)
        })

        it('applies scale when positioning a body off-origin', () => {
            /**
             * Earth is at (1.496e11, 0) in simulation space.
             * With scale = 6e-10:
             *   screenX = 500 + 1.496e11 * 6e-10 = 500 + 89.76 = 589.76
             *   screenY = 500 - 0 * 6e-10         = 500
             */
            const earth = makeEarth()
            const scale = 6e-10
            renderer.draw([earth], emptyTrails([earth]), scale)

            const arcCalls = (mockCtx.arc as ReturnType<typeof vi.fn>).mock.calls
            const [x, y] = arcCalls[0]

            expect(x).toBeCloseTo(500 + 1.496e11 * scale)
            expect(y).toBeCloseTo(500)
        })

        it('inverts the Y axis (canvas Y increases downward)', () => {
            /**
             * A body at positive Y in simulation space should appear
             * ABOVE centre (lower screenY) because canvas Y is inverted.
             *
             * screenY = centerY - position.y * scale
             * With position.y > 0, screenY < centerY (500).
             */
            const body: CelestialBody = {
                id:       'test',
                mass:     5.972e24,
                position: new Vector2(0, 1e11),
                velocity: new Vector2(0, 0),
            }
            renderer.draw([body], emptyTrails([body]), 6e-10)

            const arcCalls = (mockCtx.arc as ReturnType<typeof vi.fn>).mock.calls
            const [, y] = arcCalls[0]

            expect(y).toBeLessThan(500)
        })
    })

    // -----------------------------------------------------------------------

    describe('trail rendering', () => {
        it('does not call stroke when a body has no trail history', () => {
            const earth = makeEarth()
            renderer.draw([earth], emptyTrails([earth]), 1)

            expect(mockCtx.stroke).not.toHaveBeenCalled()
        })

        it('does not call stroke when a trail has only one point', () => {
            /**
             * A trail needs at least two points to draw a line segment.
             * One point has nothing to connect to.
             */
            const earth = makeEarth()
            const trails = new Map([['earth', [new Vector2(0, 0)]]])
            renderer.draw([earth], trails, 1)

            expect(mockCtx.stroke).not.toHaveBeenCalled()
        })

        it('calls stroke N-1 times for a trail of N points', () => {
            /**
             * A trail of 5 points has 4 segments (between consecutive pairs).
             * Each segment is one beginPath + moveTo + lineTo + stroke call.
             */
            const earth = makeEarth()
            const trailPoints = [
                new Vector2(0, 0),
                new Vector2(10, 0),
                new Vector2(20, 0),
                new Vector2(30, 0),
                new Vector2(40, 0),
            ]
            const trails = new Map([['earth', trailPoints]])
            renderer.draw([earth], trails, 1)

            expect(mockCtx.stroke).toHaveBeenCalledTimes(4)
        })

        it('draws trails before bodies (trails render underneath)', () => {
            /**
             * stroke (trail segments) should be called before arc (body circles).
             * This ensures bodies always appear on top of their own trails.
             */
            const earth = makeEarth()
            const trails = new Map([['earth', [new Vector2(0, 0), new Vector2(10, 0)]]])
            renderer.draw([earth], trails, 1)

            const strokeOrder = (mockCtx.stroke as ReturnType<typeof vi.fn>)
                .mock.invocationCallOrder[0]
            const arcOrder = (mockCtx.arc as ReturnType<typeof vi.fn>)
                .mock.invocationCallOrder[0]

            expect(strokeOrder).toBeLessThan(arcOrder)
        })
    })

    // -----------------------------------------------------------------------

    describe('edge cases', () => {
        it('handles an empty body list without throwing', () => {
            expect(() => renderer.draw([], new Map(), 1)).not.toThrow()
        })

        it('handles a body with no corresponding trail entry without throwing', () => {
            /**
             * If a body exists in the bodies array but has no entry in the
             * trails map, the renderer should skip trail drawing gracefully.
             * This protects against any initialisation race conditions.
             */
            const earth = makeEarth()
            expect(() => renderer.draw([earth], new Map(), 1)).not.toThrow()
        })
    })
})