import { bench, describe} from 'vitest'
import { SimulationEngine } from '../application/simulation-engine/SimulationEngine.ts'
import { Vector2 } from '../core/math/Vector2.ts'
import type { CelestialBody } from '../core/models/CelestialBody.ts'

const G = 6.6743e-11
const M_SUN = 1.989e30
const DT = 3_600 * 14 // 14 simulated hours

function generateBodies(n: number): CelestialBody[] {
    const bodies: CelestialBody[] = [
        {
            id: 'sun',
            mass: M_SUN,
            position: new Vector2(0, 0),
            velocity: new Vector2(0, 0),
        },
    ]

    const minAU = 0.5e11
    const maxAU = 45e11

    for (let i = 1; i < n; i++) {
        const t = (i - 1) / Math.max(n - 2, 1)
        const r = minAU * Math.pow(maxAU / minAU, t)

        const v = Math.sqrt((G * M_SUN) / r)

        bodies.push({
            id: `body-${i}`,
            mass: 5.97e24, // Earth's mass
            position: new Vector2(r, 0),
            velocity: new Vector2(0, v),
        })
    }

    return bodies
}

describe('SimulationEngine.step() - On²) scaling', () => {
    bench('2 bodies (1 force pair)', () => {
        const engine = new SimulationEngine(generateBodies(2))
        engine.step(DT)
    })

    bench('4 bodies (6 force pairs) — current simulator', () => {
        const engine = new SimulationEngine(generateBodies(4))
        engine.step(DT)
    })

    bench('8 bodies (28 force pairs)', () => {
        const engine = new SimulationEngine(generateBodies(8))
        engine.step(DT)
    })

    bench('16 bodies (120 force pairs)', () => {
        const engine = new SimulationEngine(generateBodies(16))
        engine.step(DT)
    })

    bench('32 bodies (496 force pairs)', () => {
        const engine = new SimulationEngine(generateBodies(32))
        engine.step(DT)
    })

    bench('64 bodies (2016 force pairs)', () => {
        const engine = new SimulationEngine(generateBodies(64))
        engine.step(DT)
    })
})

describe('SumulationEngine.step() - timestep size (4 bodies)', () => {
    bench('DT = 14 hours (render timestep)', () => {
        const engine = new SimulationEngine(generateBodies(4))
        engine.step(3_600 * 14)
    })

    bench('DT = 1 hour (test timestep)', () => {
        const engine = new SimulationEngine(generateBodies(4))
        engine.step(3_600 * 1)
    })

    bench('DT = 10 minutes', () => {
        const engine = new SimulationEngine(generateBodies(4))
        engine.step(600)
    })
})