import { describe, it, expect } from 'vitest'
import { computeGravitationalForce } from '../../../core/physics/gravity.ts'
import { Vector2 } from '../../../core/math/Vector2.ts'
import type { CelestialBody } from '../../../core/models/CelestialBody.ts'

/**
 * Tests for computeGravitationalForce.
 *
 * We're verifying two fundamental physical properties:
 *
 * 1. MAGNITUDE SYMMETRY (Newton's Third Law)
 *    The force A exerts on B must equal the force B exerts on A in magnitude.
 *    |F_AB| === |F_BA|
 *
 * 2. DIRECTION CORRECTNESS
 *    Gravity is attractive — the force on A must point *toward* B, and vice versa.
 *
 * --- A NOTE ON FLOATING POINT AND TOLERANCE STRATEGY ---
 *
 * toBeCloseTo(value, digits) checks absolute difference: |a - b| < 10^-digits / 2.
 * This works fine when values are near 1, but breaks for large numbers.
 *
 * At a scale of ~3.54e22 N (realistic gravitational forces), the smallest
 * representable step in IEEE 754 double precision is ~8 million — so an
 * absolute tolerance of 0.5 is meaningless.
 *
 * Instead, we use RELATIVE tolerance: we compare the *ratio* of two values
 * to 1, or compute the relative error explicitly. This approach is
 * scale-independent and is the correct strategy for physical quantities.
 *
 * Helper:
 *   relativeError(a, b) = |a - b| / max(|a|, |b|)
 * A result of 1e-14 means the values agree to 14 significant figures.
 */

const relativeError = (a: number, b: number): number =>
    Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b))

const makeSun = (): CelestialBody => ({
    id: 'sun',
    mass: 1.989e30, //kg - approximate solar mass
    position: new Vector2(0, 0),
    velocity: new Vector2(0.0, 0),
})

const makeEarth = (): CelestialBody => ({
    id: 'earth',
    mass: 5.972e24,
    position: new Vector2(1.496e11, 0),
    velocity: new Vector2(0, 0),
})

describe('computeGravitationalForce', () => {

    describe('magnitude symmetry', () => {
        it('produces equal magnitude forces on both bodies (Newton\'s Third Law)', () => {
            const sun = makeSun()
            const earth = makeEarth()

            const forceOnEarth = computeGravitationalForce(earth, sun)
            const forceOnSun = computeGravitationalForce(sun, earth)

            const ratio = forceOnEarth.magnitude() / forceOnSun.magnitude()
            expect(ratio).toBeCloseTo(1, 10)
        })

        it('scales force correctly with mass (doubling mass doubles force)', () => {
            const bodyA = makeSun()
            const bodyB = makeEarth()
            const bodyBDoubled: typeof bodyB = { ...bodyB, mass: bodyB.mass * 2 }

            const force = computeGravitationalForce(bodyA, bodyB)
            const forceDoubled = computeGravitationalForce(bodyA, bodyBDoubled)

            // F = G*m1*m2/r^2 - doubling m2 should double F
            expect(forceDoubled.magnitude()).toBeCloseTo(force.magnitude() * 2, 0)
        })

        it('follows the inverse square law (doubling distance quarters force)', () => {
            const sun = makeSun()
            const earthNear = makeEarth()
            const earthFar: typeof earthNear = {
                ...earthNear,
                position: new Vector2(earthNear.position.x * 2, 0),
            }

            const forceNear = computeGravitationalForce(sun, earthNear)
            const forceFar = computeGravitationalForce(sun, earthFar)

            //F ∝ 1/r^2 — doubling r should quarter F
            expect(forceNear.magnitude()).toBeCloseTo(forceFar.magnitude() * 4, 0)
        })
    })

    describe('direction correctness', () => {
        it('force on body A points towards body B (gravity is attractive)', () => {
            // Earth is at (1.496e11, 0) — to the right of the Sun at origin.
            // Force on the Sun from Earth should point in the +x direction.
            const sun = makeSun()
            const earth = makeEarth()

            const forceOnSun = computeGravitationalForce(sun, earth)
            expect(forceOnSun.x).toBeGreaterThan(0) // Points right, towards Earth
            expect(forceOnSun.y).toBeCloseTo(0) // No y component - aligned on x axis
        })

        it('force on body B points towards body A (equal and opposite direction)', () => {
            const sun = makeSun()
            const earth = makeEarth()

            const forceOnEarth = computeGravitationalForce(earth, sun)
            expect(forceOnEarth.x).toBeLessThan(0) // Points left, towards Sun
            expect(forceOnEarth.y).toBeCloseTo(0) // No y component
        })

        it('forces on A and B are exactly opposite in direction', () => {
            const sun = makeSun()
            const earth = makeEarth()

            const forceOnEarth = computeGravitationalForce(earth, sun)
            const forceOnSun = computeGravitationalForce(sun, earth)

            // x components are ~3.54e22 — must use relative error, not absolute.
            expect(relativeError(forceOnEarth.x, -forceOnSun.x)).toBeLessThan(1e-10)
            // y components are ~0 — absolute comparison is fine here.
            expect(forceOnEarth.y).toBeCloseTo(-forceOnSun.y)
        })

        it('returns zero force when both bodies occupy the same position', () => {
            // This tests the singularity guard in gravity.ts.
            // Without it, distance = 0 → division by zero → Infinity or NaN,
            // which would corrupt the entire simulation state.
            const bodyA = makeSun()
            const bodyB: typeof bodyA = { ...makeSun(), id: 'body-b' }

            const force = computeGravitationalForce(bodyA, bodyB)
            expect(force.x).toBe(0)
            expect(force.y).toBe(0)
        })
    })
})