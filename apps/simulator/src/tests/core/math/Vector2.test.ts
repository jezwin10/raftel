import { describe, it, expect } from 'vitest'
import { Vector2 } from '../../../../src/core/math/Vector2'

/**
 * Tests for the Vector2 class.
 *
 * We're testing a math primitive, so the goal is to verify that every
 * operation returns the correct result AND does not mutate the original.
 *
 * Immutability is a design contract of Vector2 — if it breaks, physics
 * calculations that reuse vectors across steps will produce wrong results.
 *
 * --- WHY THESE NUMBERS? ---
 * We use simple, human-verifiable inputs (3-4-5 triangles, unit vectors)
 * so you can mentally confirm the expected output without a calculator.
 * This is a good practice for physics unit tests — if a test fails,
 * you should be able to reason about why by inspection.
 */

describe('Vector2', () => {

    describe('add', () => {
        it('returns the correct sum of two vectors', () => {
            const a = new Vector2(1, 2)
            const b = new Vector2(3, 4)
            const result = a.add(b)
            expect(result.x).toBe(4)
            expect(result.y).toBe(6)
        })

        it('does not mutate the original vector', () => {
            const a = new Vector2(1, 2)
            const b = new Vector2(2, 3)
            a.add(b)
            expect(a.x).toBe(1)
            expect(a.y).toBe(2)
        })
    }) // End of add test

    describe('subtract', () => {
        it('returns the correct difference of two vectors', () => {
            const a = new Vector2(5, 7)
            const b = new Vector2(2, 3)
            const result = a.subtract(b)
            expect(result.x).toBe(3)
            expect(result.y).toBe(4)
        })

        it('does not mutate the original vector', () => {
            const a = new Vector2(5, 7)
            const b = new Vector2(2, 3)
            a.subtract(b)
            expect(a.x).toBe(5)
            expect(a.y).toBe(7)
        })
    }) // End of subtract test

    describe('multiply ', () => {
        it('scales the vector by a positive scalar', () => {
            const v = new Vector2(3, 4)
            const result = v.multiply(2)
            expect(result.x).toBe(6)
            expect(result.y).toBe(8)
        })

        it('negates the vector when multiplied by -1', () => {
            const v = new Vector2(3, 4)
            const result = v.multiply(-1)
            expect(result.x).toBe(-3)
            expect(result.y).toBe(-4)
        })

        it('returns a zero vector when multiplied by 0', () => {
            const v = new Vector2(2, 3)
            const result = v.multiply(0)
            expect(result.x).toBe(0)
            expect(result.y).toBe(0)
        })

        it('does not mutuate the original vector', () => {
            const v = new Vector2(3, 4)
            v.multiply(2)
            expect(v.x).toBe(3)
            expect(v.y).toBe(4)
        })
    }) // End of multiply test

    describe('magnitude', () => {
        it('returns the correct magnitude for a 3-4-5 right triangle', () => {
            // The 3-4-5 triangle is the canonical human verifiable case:
            // sqrt(3^2 + 4^2) = (sqrt(9 + 16) = sqrt(25) = 5
            const v = new Vector2(3, 4)
            expect(v.magnitude(0)).toBe(5)
        })

        it('returns 0 for the zero vector', () => {
            const v = new Vector2(0, 0)
            expect(v.magnitude()).toBe(0)
        })
    }) // End of magnitude test

    describe('normalize', () => {
        it('returns a unit vector with magnitude 1', () => {
            const v = new Vector2(3, 4)
            const result = v.normalize()
            // Use toBeCloseTo for floating point - exact equality is unreliable
            // toBeCloseTo checks to 5 decimal places
            expect(result.magnitude()).toBeCloseTo(1)
        })

        it('returns the correct direction for a known vector', () => {
            // A vector pointing purely right should normalise to (1, 0)
            const v = new Vector2(5, 0)
            const result = v.normalize()
            expect(result.x).toBeCloseTo(1)
            expect(result.y).toBeCloseTo(0)
        })

        it ('returns a zero vector when normalizing the zero vector', () => {
            // Singularity guard
            const v = new Vector2(0, 0)
            const result = v.normalize()
            expect(result.x).toBe(0)
            expect(result.y).toBe(0)
        })

        it('does not mutate the original vector', () => {
            const v = new Vector2(3, 4)
            v.normalize()
            expect(v.x).toBe(3)
            expect(v.y).toBe(4)
        })
    })
});