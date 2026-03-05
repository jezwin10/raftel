import type { CelestialBody } from '../../core/models/CelestialBody.ts'
import type { Vector2 } from '../../core/math/Vector2.ts'

/**
 * CanvasRenderer
 *
 * Architectural role: this class lives in /infrastructure/rendering because
 * it is the only layer that knows the browser exists. Everything above it
 * (core, application) is rendering-agnostic — you could swap this out for
 * a WebGL renderer or a test renderer that just captures coordinates, and
 * the physics engine would be completely unaffected.
 *
 * This class has one responsibility: given a list of bodies and a scale,
 * draw them onto a canvas context. It makes no physics decisions.
 *
 * --- CANVAS API PRIMER ---
 * The 2D canvas context is a stateful drawing API.
 * The general pattern for drawing a shape is:
 *   1. ctx.beginPath()           — start a new path (clears the previous one)
 *   2. ctx.arc(x, y, r, 0, 2π)  — describe a circle
 *   3. ctx.fillStyle = '...'     — set the fill colour
 *   4. ctx.fill()                — rasterise the path
 *
 * Critically, you must call beginPath() before each shape, otherwise the
 * context accumulates paths and fills them all at once in the last colour.
 */

export class CanvasRenderer {
    private readonly ctx: CanvasRenderingContext2D

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx
    }

    /**
     * Draws one complete frame.
     *
     * @param bodies - The current state from the simulation engine
     * @param scale  - Pixels per metre. Converts simulation coordinates
     *                 (metres) into screen coordinates (pixels).
     *                 Example: scale = 2e-9 means 1 AU ≈ 300px.
     */

    draw(bodies: CelestialBody[], trails: Map<string, Vector2[]>, scale: number): void {
        const { width, height } = this.ctx.canvas
        const centreX = width / 2
        const centreY = height / 2

        // Clear the previous frame.
        // Fill the entire canvas with the background colour rather than calling ctx.clearRect()
        this.ctx.fillStyle = '#0d0d1a'
        this.ctx.fillRect(0, 0, width, height)

        // Draw Trail
        for (const body of bodies) {
            const trail = trails.get(body.id)
            if (trail && trail.length > 1) {
                this.drawTrail(trail, body, scale, centreX, centreY)
            }
        }

        // Draw Bodies
        for (const body of bodies) {
            // Convert simulation coordinates (metres, origin at 0,0)
            // to screen coordinates (pixels, origin at top-left).
            //
            // We place the simulation origin at the canvas centre, then
            // multiply by scale to convert metres → pixels.
            //
            // Note: canvas Y axis points DOWN. Physics Y axis points UP.
            // For this simulator we're working in a top-down 2D plane,
            // so we negate the Y to give an intuitive orientation.
            const screenX = centreX + body.position.x * scale
            const screenY = centreY - body.position.y * scale

            this.ctx.beginPath()
            this.ctx.arc(screenX, screenY, this.radiusFor(body), 0, Math.PI * 2)
            this.ctx.fillStyle = this.colorFor(body)
            this.ctx.fill()

            // Optional glow effect for stars — a second, larger, semi-transparent
            // circle that creates a soft bloom. Pure visual, no physics.
            if (body.mass > 1e29) {
                this.ctx.beginPath()
                this.ctx.arc(screenX, screenY, this.radiusFor(body) * 2.5, 0, Math.PI * 2)
                this.ctx.fillStyle = 'rgba(253, 184, 19, 0.08)'
                this.ctx.fill()
            }
        }
    }

    /**
     * Draws a fading trail for a single body.
     *
     * @param trail    - Array of historical positions, oldest first
     * @param body     - The body this trail belongs to (used for colour)
     * @param scale    - Pixels per metre
     * @param centerX  - Canvas centre X (pixels)
     * @param centerY  - Canvas centre Y (pixels)
     *
     * Opacity formula: opacity = (segmentIndex / totalSegments) * MAX_OPACITY
     *
     * segmentIndex 0 is the oldest pair → near transparent
     * segmentIndex N is the newest pair → near MAX_OPACITY
     *
     * We cap MAX_OPACITY at 0.6 rather than 1.0 so the trail is
     * visually subordinate to the body itself.
     */

    private drawTrail(
        trail: Vector2[],
        body: CelestialBody,
        scale: number,
        centreX: number,
        centreY: number
    ): void {
        const rgb = this.trailColorFor(body)
        const total = trail.length

        for (let i = 1; i < total; i++) {
            const prev = trail[i - 1]
            const curr = trail[i]

            const opacity = (i/total) * 0.6

            this.ctx.beginPath()
            this.ctx.strokeStyle = `rgba(${rgb}, ${opacity})`

            /**
             * lineWidth tapers from 1.5 at the head to 0.5 at the tail.
             * This reinforces the sense of recency without needing
             * a separate draw pass.
             */

            this.ctx.lineWidth = 0.5 + (i/total)

            this.ctx.moveTo(
                centreX + prev.x * scale,
                centreY - prev.y * scale
            )
            this.ctx.lineTo(
                centreX + curr.x * scale,
                centreY - curr.y * scale
            )
            this.ctx.stroke()
        }
    }

    /**
     * Derives a visual radius from mass using a logarithmic scale.
     *
     * We use log₁₀ because mass spans many orders of magnitude:
     *   Sun:   1.989e30 kg  → log₁₀ ≈ 30.3  → radius ≈ 14px
     *   Earth: 5.972e24 kg  → log₁₀ ≈ 24.8  → radius ≈  5px
     *   Mars:  6.39e23  kg  → log₁₀ ≈ 23.8  → radius ≈  4px
     *
     * Without the log, the sun would need to be 1 million times larger
     * than Earth on screen — clearly unusable.
     */
    private radiusFor(body: CelestialBody): number {
        return Math.max(3, Math.log10(body.mass) - 20)
    }

    /**
     * Assigns colour based on mass range.
     *
     * This is a deliberate simplification for Phase 1. A more sophisticated
     * renderer might accept a metadata map keyed by body ID. For now, mass
     * ranges are a good enough heuristic to distinguish body types visually.
     */
    private colorFor(body: CelestialBody): string {
        if (body.mass > 1e29) return '#FDB813' // stellar mass → solar gold
        if (body.mass > 1e26) return '#C88B3A'
        if (body.mass > 5e24) return '#4FC3F7' // Earth-scale   → light blue
        if (body.mass > 6e23) return '#FF6B35' // Mars-scale     → orange-red
        return '#B0BEC5'                        // smaller body   → grey
    }

    private trailColorFor(body: CelestialBody): string {
        if (body.mass > 1e29) return '253, 184, 19' // Solar Gold
        if (body.mass > 1e26) return '200, 139, 58' // Jupiter Tan
        if (body.mass > 5e24) return '79, 195, 247' // Earth Blue
        if (body.mass > 6e23) return '255, 107, 53' // Mars orange
        return '176, 190, 1917' // Grey
    }
}