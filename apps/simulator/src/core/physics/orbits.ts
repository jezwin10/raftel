import { Vector2 } from '../math/Vector2.ts'

const G = 6.6743e-11

export interface OrbitalParameters {
    semiMajorAxis: number
    eccentricity: number
    centralMass: number
}

export interface CartesianState {
    position: Vector2
    velocity: Vector2
}

export function keplerianToCartesian(params: OrbitalParameters): CartesianState {
    const { semiMajorAxis: a, eccentricity: e, centralMass: M } = params

    if (e < 0 || e >= 1) {
        throw new RangeError(
            `Eccentricity must be in [0, 1] for a closed orbit. Received: ${e}`
        )
    }

    if (a <= 0) {
        throw new RangeError(
            `Semi-major axis must be positive. Received: ${a}`
        )
    }

    const r_periapsis = a * (1 - e)

    const v_periapsis = Math.sqrt((G * M * (1 + e)) / (a * (1 - e)))

    return {
        position: new Vector2(r_periapsis, 0),
        velocity: new Vector2(0, v_periapsis),
    }
}

export function totalMechanicalEnergy(
    m1: number, v1: Vector2,
    m2: number, v2: Vector2,
    separation: number
): number {
    const kineticEnergy = 0.5 * m1 * v1.magnitude() ** 2 + 0.5 * m2 * v2.magnitude() ** 2
    const potentialEnergy = -(G * m1 * m2) / separation
    return kineticEnergy + potentialEnergy
}