import type { CelestialBody } from '../../core/models/CelestialBody.ts'
import type { Vector2 } from '../../core/math/Vector2.ts'

/**
 * CanvasRenderer
 *
 * Unchanged rendering logic from the previous version, with one addition:
 * bodyRadius() is now exported as a standalone pure function.
 *
 * --- WHY EXPORT bodyRadius? ---
 * Click detection in useSimulation needs to know how large each body
 * appears on screen to determine whether a click landed on it.
 * If we kept the radius calculation private, we'd have to duplicate
 * the formula — and if it ever changed, we'd have a silent mismatch
 * between what renders and what's clickable.
 *
 * Exporting it as a named function makes the radius calculation the
 * single source of truth for both rendering and hit detection.
 */

export function bodyRadius(body: CelestialBody): number {
    return Math.max(3, Math.log10(body.mass) - 20)
}

export class CanvasRenderer {
    private readonly ctx: CanvasRenderingContext2D

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx
    }

    draw(bodies: CelestialBody[], trails: Map<string, Vector2[]>, scale: number): void {
        const { width, height } = this.ctx.canvas
        const centerX = width / 2
        const centerY = height / 2

        this.ctx.fillStyle = '#0d0d1a'
        this.ctx.fillRect(0, 0, width, height)

        for (const body of bodies) {
            const trail = trails.get(body.id)
            if (trail && trail.length > 1) {
                this.drawTrail(trail, body, scale, centerX, centerY)
            }
        }

        for (const body of bodies) {
            const screenX = centerX + body.position.x * scale
            const screenY = centerY - body.position.y * scale

            this.ctx.beginPath()
            this.ctx.arc(screenX, screenY, bodyRadius(body), 0, Math.PI * 2)
            this.ctx.fillStyle = this.colorFor(body)
            this.ctx.fill()

            if (body.mass > 1e29) {
                this.ctx.beginPath()
                this.ctx.arc(screenX, screenY, bodyRadius(body) * 2.5, 0, Math.PI * 2)
                this.ctx.fillStyle = 'rgba(253, 184, 19, 0.08)'
                this.ctx.fill()
            }
        }
    }

    private drawTrail(
        trail: Vector2[],
        body: CelestialBody,
        scale: number,
        centerX: number,
        centerY: number
    ): void {
        const rgb   = this.trailColorFor(body)
        const total = trail.length

        for (let i = 1; i < total; i++) {
            const prev    = trail[i - 1]
            const curr    = trail[i]
            const opacity = (i / total) * 0.6

            this.ctx.beginPath()
            this.ctx.strokeStyle = `rgba(${rgb}, ${opacity})`
            this.ctx.lineWidth   = 0.5 + (i / total)
            this.ctx.moveTo(centerX + prev.x * scale, centerY - prev.y * scale)
            this.ctx.lineTo(centerX + curr.x * scale, centerY - curr.y * scale)
            this.ctx.stroke()
        }
    }

    private colorFor(body: CelestialBody): string {
        if (body.mass > 1e29) return '#FDB813'
        if (body.mass > 1e26) return '#C88B3A'
        if (body.mass > 5e24) return '#4FC3F7'
        if (body.mass > 1e23) return '#FF6B35'
        return '#B0BEC5'
    }

    private trailColorFor(body: CelestialBody): string {
        if (body.mass > 1e29) return '253, 184, 19'
        if (body.mass > 1e26) return '200, 139, 58'
        if (body.mass > 5e24) return '79, 195, 247'
        if (body.mass > 1e23) return '255, 107, 53'
        return '176, 190, 197'
    }
}