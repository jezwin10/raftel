import {Vector2} from "../math/Vector2.ts"

/**
 * Represents a physical body in the simulation.
 *
 * Contains only state — no behavior.
 */

export interface CelestialBody {
    id: string
    mass: number
    position: Vector2
    velocity: Vector2
}