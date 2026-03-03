import type { CelestialBody } from "../../core/models/CelestialBody"
import { computeGravitationalForce } from "../../core/physics/gravity"
import { Vector2 } from "../../core/math/Vector2"

export class SimulationEngine {
    private bodies: CelestialBody[]

    constructor(initialBodies: CelestialBody[]) {
        this.bodies = initialBodies
    }

    step(deltaTime: number): void {
        const forces: Record<string, Vector2> = {}

        for (const body of this.bodies) {
            forces[body.id] = new Vector2(0, 0)
        }

        /**
         *
         * For each unique body pair:
         * - Calculate force on A from B.
         * - Apply equal and opposite force on B.
         *
         * Ensures conservation of momentum.
         */
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyA = this.bodies[i]
                const bodyB = this.bodies[j]

                const forceOnA = computeGravitationalForce(bodyA, bodyB)
                const forceOnB = forceOnA.multiply(-1)

                forces[bodyA.id] = forces[bodyA.id].add(forceOnA)
                forces[bodyB.id] = forces[bodyB.id].add(forceOnB)
            }
        }

        /**
         * Semi-implicit Euler integration:
         *
         * 1. Compute acceleration from accumulated forces.
         * 2. Update velocity using acceleration.
         * 3. Update position using updated velocity.
         *
         * Deterministic for fixed deltaTime.
         */
        this.bodies = this.bodies.map(body => {
            const acceleration = forces[body.id].multiply(1 / body.mass)
            const newVelocity = body.velocity.add(acceleration.multiply(deltaTime))
            const newPosition = body.position.add(newVelocity.multiply(deltaTime))

            return {
                ...body,
                velocity: newVelocity,
                position: newPosition
            }
        })
    }

    getBodies(): CelestialBody[] {
        return this.bodies
    }
}