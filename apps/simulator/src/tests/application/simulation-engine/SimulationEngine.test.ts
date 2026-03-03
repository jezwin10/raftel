
import { describe, it, expect } from 'vitest'
import { SimulationEngine } from '../../../application/simulation-engine/SimulationEngine.ts'
import { Vector2 } from '../../../core/math/Vector2.ts'
import type { CelestialBody } from '../../../core/models/CelestialBody.ts'

/**
 * Tests for SimulationEngine.step().
 *
 * The engine uses semi-implicit Euler integration:
 *
 *   acceleration  = force / mass
 *   new_velocity  = velocity + (acceleration * dt)
 *   new_position  = position + (new_velocity * dt)   ← uses updated velocity
 *
 * The "semi-implicit" distinction matters: using the *updated* velocity to
 * integrate position (rather than the old velocity) gives better energy
 * conservation — the simulation doesn't spiral outward over time.
 *
 * --- WHAT WE'RE TESTING ---
 * 1. DETERMINISM: same inputs always produce same outputs
 * 2. INTEGRATION CORRECTNESS: position and velocity update according to
 *    the expected semi-implicit Euler formula
 * 3. MOMENTUM CONSERVATION: total momentum before and after a step
 *    should be conserved (Newton's Third Law at the engine level)
 * 4. ISOLATED BODY: a body with no other bodies in the simulation
 *    should travel in a straight line (no force, constant velocity)
 *
 * --- WHY SMALL MASSES AND DISTANCES? ---
 * Using physically real values (solar masses, AU distances) in integration
 * tests produces numbers with large exponents that are hard to reason about.
 * For engine tests, we use simple values so we can hand-compute expected
 * outputs and confirm the test is actually testing what we think it is.
 */

const makeBody = (
    id: string,
    mass: number,
    px: number, py: number,
    vx: number, vy: number
): CelestialBody => ({
        id,
        mass,
        position: new Vector2(px, py),
        velocity: new Vector2(vx, vy),
})

describe('SimulationEngine', () => {

    describe('determinism', () => {
        it('produces identical state for identical inputs across two independent runs', () => {
            const bodies = () => [
                makeBody('a', 1e10, 0, 0, 0, 0),
                makeBody('b', 1e10, 100, 0, 0, 0),
            ]

            const engineOne = new SimulationEngine(bodies())
            const engineTwo = new SimulationEngine(bodies())

            engineOne.step(1)
            engineTwo.step(1)

            const [a1, b1] = engineOne.getBodies()
            const [a2, b2] = engineTwo.getBodies()

            expect(a1.position.x).toBe(a2.position.x)
            expect(a1.position.y).toBe(a2.position.y)
            expect(b1.position.x).toBe(b2.position.x)
            expect(b1.position.y).toBe(b2.position.y)
        })

        it('produces different state for different deltaTime values', () => {
            const bodies = () => [
                makeBody('a', 1e10, 0, 0, 0, 0),
                makeBody('b', 1e10, 100, 0, 0, 0),
            ]

            const engineSmall = new SimulationEngine(bodies())
            const engineLarge = new SimulationEngine(bodies())

            engineSmall.step(0.5)
            engineLarge.step(2.0)

            const [aSmall] = engineSmall.getBodies()
            const [aLarge] = engineLarge.getBodies()

            expect(aSmall.position.x).not.toBe(aLarge.position.x)
        })
    })

    describe('isolated body (no gravitational interaction)', () => {
        it('a lone body with no velocity does not move', () => {
            const engine = new SimulationEngine([
                makeBody('solo', 1e10, 50, 50, 0, 0),
            ])

            engine.step(1)

            const [solo] = engine.getBodies()
            expect(solo.position.x).toBe(50)
            expect(solo.position.y).toBe(50)
        })

        it('a lone body with constant velocity moves in a straight line', () => {
            // No other bodies means no force, so acceleration is zero.
            // The body should advance by velocity * deltaTime each step.
            const engine = new SimulationEngine([
                makeBody('solo', 1e10, 0, 0, 10, 5),
            ])

            engine.step(1)
            const [afterOne] = engine.getBodies()

            // With zero force: new_velocity = (10, 5) + (0 * 1) = (10, 5)
            //                  new_position = (0, 0) + (10, 5) * 1 = (10, 5)
            expect(afterOne.position.x).toBeCloseTo(10)
            expect(afterOne.position.y).toBeCloseTo(5)

            engine.step(1)
            const[afterTwo] = engine.getBodies()
            expect(afterTwo.position.x).toBeCloseTo(20)
            expect(afterTwo.position.y).toBeCloseTo(10)
        })
    })

    describe('momentum conservation', () => {
        it('conserves total linear momentum across a step', () => {
            // Total momentum p = sum(mass * velocity) for all bodies.
            // Newton's Third Law guarantees this is conserved when forces
            // are applied as equal-and-opposite pairs, as the engine does.
            const bodies = [
                makeBody('a', 2e10, 0,   0, 3, 0),
                makeBody('b', 1e10, 100, 0, -6, 0),
            ]

            // Calculate initial total momentum
            const initialPx = bodies.reduce((sum, b) => sum + b.mass * b.velocity.x, 0)
            const initialPy = bodies.reduce((sum, b) => sum + b.mass * b.velocity.y, 0)

            const engine = new SimulationEngine(bodies)
            engine.step(1)

            const afterStep = engine.getBodies()
            const finalPx = afterStep.reduce((sum, b) => sum + b.mass * b.velocity.x, 0)
            const finalPy = afterStep.reduce((sum, b) => sum + b.mass * b.velocity.y, 0)

            // Momentum should be conserved to floating point precision.
            // We use a relative tolerance rather than toBeCloseTo here,
            // because the absolute values are large (order 1e11).
            const tolerance = 1e-3
            expect(Math.abs(finalPx - initialPx)).toBeLessThan(tolerance)
            expect(Math.abs(finalPy - initialPy)).toBeLessThan(tolerance)
        })
    })

    describe('integration correctness', () => {
        it('updates velocity and position according to semi-implicit Euler formula', () => {
            /**
             * This test hand-verifies one complete integration step.
             *
             * Setup:
             *   Body A: mass=1e12, position=(0,0),   velocity=(0,0)
             *   Body B: mass=1e12, position=(1000,0), velocity=(0,0)
             *   deltaTime = 1
             *
             * Step-by-step expected calculation:
             *   distance      = 1000
             *   F = G * m1 * m2 / r^2
             *     = 6.6743e-11 * 1e12 * 1e12 / 1000^2
             *     = 6.6743e-11 * 1e24 / 1e6
             *     = 6.6743e7 N  (in +x direction for body A)
             *
             *   acceleration_A = F / mass_A = 6.6743e7 / 1e12 = 6.6743e-5 m/s^2
             *
             *   new_velocity_A.x = 0 + 6.6743e-5 * 1 = 6.6743e-5
             *   new_position_A.x = 0 + 6.6743e-5 * 1 = 6.6743e-5
             *
             * Body B is symmetric (force in -x direction).
             */
            const G = 6.6743e-11
            const mass = 1e12
            const distance = 1000
            const dt = 1

            const engine = new SimulationEngine([
                makeBody('a', mass, 0,        0, 0, 0),
                makeBody('b', mass, distance, 0, 0, 0),
            ])

            engine.step(dt)

            const [a, b] = engine.getBodies()

            const expectedForce = G * mass * mass / (distance * distance)
            const expectedAccel = expectedForce / mass
            const expectedVelocity = expectedAccel * dt
            const expectedPosition = expectedVelocity * dt

            expect(a.velocity.x).toBeCloseTo(expectedVelocity, 10)
            expect(a.position.x).toBeCloseTo(expectedPosition, 10)

            // Body B moves in the opposite direction (toward A, which is at x=0)
            expect(b.velocity.x).toBeCloseTo(-expectedVelocity, 10)
            expect(b.position.x).toBeCloseTo(distance - expectedPosition, 10)
        })
    })

})