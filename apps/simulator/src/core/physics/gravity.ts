/**
 * Uses Newton's Law of Universal Gravitation:
 *
 * F = G * (m1 * m2) / r^2
 *
 * Direction is normalized vector from bodyA → bodyB.
 *
 * Pure function:
 * - No mutation
 * - No global state changes
 */

import { Vector2 } from "../math/Vector2.ts"
import type { CelestialBody } from "../models/CelestialBody.ts"

const G = 6.67430e-11

export function computeGravitationalForce(
    bodyA: CelestialBody,
    bodyB: CelestialBody
): Vector2 {
    const direction = bodyB.position.subtract(bodyA.position)
    const distance = direction.magnitude()

    if (distance === 0) return new Vector2(0, 0)
    // Prevent singularity when bodies overlap (distance = 0).
    // Returns zero force to maintain numerical stability.

    const forceMagnitude = (G * bodyA.mass * bodyB.mass) / (distance * distance)

    return direction.normalize().multiply(forceMagnitude)
}