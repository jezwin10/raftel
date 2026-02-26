/**
 * Immutable 2D vector.
 *
 * All operations return new instances.
 * This avoids mutation side-effects in physics calculations.
 *
 * Deterministic and rendering-agnostic.
 */

export class Vector2 {
    public readonly x: number
    public readonly y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y)
    }

    subtract(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y)
    }

    multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar)
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    normalize(): Vector2 {
        const mag = this.magnitude()
        if (mag === 0) return new Vector2(0, 0) // If magnitude is zero, return zero vector to avoid NaN propagation.
        return new Vector2(this.x / mag, this.y / mag)
    }
}