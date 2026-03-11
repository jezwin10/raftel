import {useEffect, useRef, useState} from 'react'
import { SimulationEngine } from "./simulation-engine/SimulationEngine.ts"
import { CanvasRenderer } from "../infrastructure/rendering/CanvasRenderer.ts"
import { Vector2 } from "../core/math/Vector2.ts"
import type { CelestialBody } from "../core/models/CelestialBody.ts"

/**
 * useSimulation
 *
 * A custom hook that owns the full simulation lifecycle:
 *   - Creates the canvas ref (returned for the component to attach)
 *   - Instantiates the SimulationEngine with initial bodies
 *   - Runs the requestAnimationFrame loop
 *   - Cleans up when the component unmounts
 *
 * --- WHY A CUSTOM HOOK? ---
 * React hooks let you extract stateful logic out of components into
 * reusable functions. The convention is the `use` prefix, which tells
 * React (and the linter) that this function follows hook rules.
 *
 * The component using this hook gets a single clean interface:
 *   const canvasRef = useSimulation()
 * All the complexity — the engine, the loop, the cleanup — is hidden here.
 * This is the single responsibility principle applied to React.
 *
 * --- SCALE AND TIME ---
 * These two constants bridge the gap between the simulation's physical
 * units (SI) and what's visible on screen.
 *
 * SCALE: pixels per metre.
 * Earth orbits at 1 AU = 1.496e11 m. We want that to appear at ~300px
 * from centre on an 800px canvas: 300 / 1.496e11 ≈ 2.0e-9 px/m.
 *
 * DT: simulation seconds per animation frame.
 * Earth's orbital period is ~3.156e7 s (1 year). At 60fps, to make
 * one orbit take ~10 real seconds: 3.156e7 / (10 × 60) ≈ 52,600 s/frame.
 * We use 50,400 s (14 hours) per frame — close enough and round.
 * This gives ~626 physics steps per Earth orbit, which is stable for
 * semi-implicit Euler integration.
 */

/**
 * SCALE — pixels per metre.
 *
 * Updated from 2.0e-9 to 6.0e-10 to accommodate Jupiter.
 *
 * Calculation: we want Jupiter (~7.785e11 m from the Sun) to sit at
 * roughly 430px from the canvas centre on a 1000px canvas (leaving
 * a comfortable margin).
 *
 *   scale = 430 / 7.785e11 ≈ 5.52e-10
 *
 * At this scale:
 *   Earth:   1.496e11 × 6e-10 ≈  90px from centre  ✓
 *   Mars:    2.279e11 × 6e-10 ≈ 137px from centre  ✓
 *   Jupiter: 7.785e11 × 6e-10 ≈ 467px from centre  ✓
 */

const SCALE = 6.0e-10 // pixels per meter

/**
 * BASE_DT — simulated seconds per animation frame at 1× speed.
 *
 * 14 simulated hours per frame (unchanged from before).
 * At 60fps, Earth completes one orbit in ~626 frames ≈ 10.4 real seconds.
 * Jupiter completes one orbit in ~7,427 frames ≈ 124 real seconds at 1×.
 * The speed multiplier lets users compress that.
 */

const BASE_DT = 3_600 * 14

/**
 * MAX_TRAIL_LENGTH — how many historical positions to retain per body.
 *
 * 200 points × 4 bodies = 800 Vector2 objects in memory at any time.
 * Each Vector2 is two 64-bit floats = 16 bytes → ~12.8KB total.
 * Negligible memory cost, good visual trail length.
 *
 * Increasing this makes trails longer but does not affect physics.
 */

const MAX_TRAIL_LENGTH = 200

//const DT = 3_600 * 14 // 14 simulated hours per animation frame

/**
 * Initial bodies in SI units.
 *
 * Orbital velocities are calculated for circular orbits:
 *   v = √(G × M_sun / r)
 *
 * The velocity is perpendicular to the position vector.
 * Since each planet starts on the +x axis, the circular orbit
 * velocity points in the +y direction.
 *
 * Earth: v = √(6.674e-11 × 1.989e30 / 1.496e11) ≈ 29,783 m/s
 * Mars:  v = √(6.674e-11 × 1.989e30 / 2.279e11) ≈ 24,077 m/s
 */
const INITIAL_BODIES: CelestialBody[] = [
    {
        id: 'sun',
        mass: 1.989e30,
        position: new Vector2(0,0),
        velocity: new Vector2(0, 0),
    },
    {
        id: 'mercury',
        mass: 3.285e23,
        position: new Vector2(0.528e11, 0),
        velocity: new Vector2(0, 50_141),
    },
    {
        id: 'venus',
        mass: 4.867e24,
        position: new Vector2(1.089e11, 0),
        velocity: new Vector2(0, 34_913),
    },
    {
        id: 'earth',
        mass: 5.972e24,
        position: new Vector2(1.496e11, 0),
        velocity: new Vector2(0, 29_783),
    },
    {
        id: 'mars',
        mass: 6.39e23,
        position: new Vector2(2.279e11, 0),
        velocity: new Vector2(0, 24_077),
    },
    {
        id: 'jupiter',
        mass: 1.898e27,
        position: new Vector2(7.827e11, 0),
        velocity: new Vector2(0, 13_023),
    },
]

export interface SimulationControls {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    isPaused: boolean
    togglePause: () => void
    speed: number
    setSpeed: (value: number) => void
}

/**
 * trailsRef — mutable position history, keyed by body ID.
 *
 * Stored as a ref (not state) because:
 *   - It changes every frame — state would cause 60 re-renders/second.
 *   - The renderer reads it directly; React doesn't need to know about it.
 *
 * Initialised with an empty array for each body so the renderer can
 * safely call trails.get(id) without null-checking from frame one.
 */

export function useSimulation(): SimulationControls{
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const engineRef = useRef<SimulationEngine | null>(null)

    const trailsRef = useRef<Map<string, Vector2[]>>(
        new Map(INITIAL_BODIES.map(b => [b.id, []]))
    )

    const [isPaused, setIsPaused] = useState(false)
    const isPausedRef = useRef(false)

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current
        setIsPaused(isPausedRef.current)
    }

    const [speed, setSpeedState] = useState(1)
    const speedRef = useRef(1)

    const setSpeed = (value: number) => {
        speedRef.current = value
        setSpeedState(value)
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        engineRef.current = new SimulationEngine(INITIAL_BODIES)

        const renderer = new CanvasRenderer(ctx)

        let animationId: number

        const loop = () => {
            if (!isPausedRef.current) {
                engineRef.current?.step(BASE_DT * speedRef.current)

                const bodies = engineRef.current?.getBodies() ?? []

                for (const body of bodies) {
                    const trail = trailsRef.current.get(body.id)
                    if (trail) {
                        trail.push(body.position)

                        if (trail.length > MAX_TRAIL_LENGTH) {
                            trail.shift()
                        }
                    }
                }
            }

            renderer.draw(
                engineRef.current?.getBodies() ?? [],
                trailsRef.current,
                SCALE
            )

            animationId = requestAnimationFrame(loop)
        }

        animationId = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(animationId)
        }
    }, [])

    return { canvasRef, isPaused, togglePause, speed, setSpeed}

}