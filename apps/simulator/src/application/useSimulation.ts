import { useEffect, useRef } from 'react'
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

const SCALE = 2.0e-9 // pixels per meter
const DT = 3_600 * 14 // 14 simulated hours per animation frame

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
    // {
    //     id: 'jupiter',
    //     mass: 1.898e27,
    //     position: new Vector2(7.827e11, 0),
    //     velocity: new Vector2(0, 13_023),
    // },
]

export function useSimulation(): React.RefObject<HTMLCanvasElement | null> {
    /**
     * canvasRef — a DOM ref.
     *
     * We create the ref here in the hook rather than in the component
     * so that the hook owns its own dependency. The component receives it
     * and attaches it to the <canvas> element via the `ref` prop.
     *
     * Execution order (important to understand):
     *   1. useSimulation() runs → canvasRef is created (current = null)
     *   2. Component renders → React attaches the canvas DOM node to canvasRef.current
     *   3. useEffect runs → canvasRef.current is now the live canvas element
     *
     * This ordering is why we can safely read canvasRef.current inside useEffect
     * with an empty dependency array — by the time the effect runs, the ref is set.
     */
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    /**
     * engineRef — a value ref (not a DOM ref).
     *
     * We store the SimulationEngine in a ref rather than state because:
     *   - We don't want React to re-render when physics state changes
     *     (the canvas handles its own visual updates imperatively).
     *   - Refs persist across renders, so the engine survives re-renders
     *     without being reconstructed.
     *   - The animation loop can always read engineRef.current fresh,
     *     avoiding the stale closure problem entirely.
     *
     * Stale closure recap: if we stored the engine in a regular variable
     * inside the effect, the animation loop callback would forever see
     * the value captured at the moment the effect first ran — it would
     * never update. A ref's .current property is read live on every access.
     */
    const engineRef = useRef<SimulationEngine | null>(null)

    useEffect(() => {
        /**
         * Why the null checks?
         *
         * TypeScript knows canvasRef.current could be null (before React
         * attaches the element), and getContext() can also return null
         * (if the browser doesn't support canvas). We guard both cases.
         * If either is null, we return undefined — React accepts this as
         * "no cleanup needed".
         */
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        engineRef.current = new SimulationEngine(INITIAL_BODIES)

        const renderer = new CanvasRenderer(ctx)

        /**
         * The animation loop.
         *
         * requestAnimationFrame (rAF) calls our function before the next
         * browser repaint, targeting the display's refresh rate (usually 60fps).
         *
         * We store the return value (a numeric ID) in animationId so we can
         * cancel the loop in the cleanup function. Without cancellation, the
         * loop would continue running after the component unmounts — a memory
         * leak and a source of errors.
         *
         * Notice we read engineRef.current inside the loop, not a captured
         * `engine` variable. This is the ref pattern for avoiding stale closures.
         */
        let animationId: number

        const loop = () => {
            engineRef.current?.step(DT)
            renderer.draw(engineRef.current?.getBodies() ?? [], SCALE)
            animationId = requestAnimationFrame(loop)
        }
        // Start the first frame
        animationId = requestAnimationFrame(loop)

        /**
         * Cleanup function.
         *
         * React calls this when the component unmounts, and — in Strict Mode
         * during development — also between the two mounts it performs to
         * verify your effects are properly cleaned up.
         *
         * cancelAnimationFrame(id) tells the browser to drop the scheduled
         * callback. Without this, the loop outlives the component.
         */
        return () => {
            cancelAnimationFrame(animationId)
        }
    }, [])
    /**
     * Why the empty dependency array []?
     *
     * The effect depends on canvasRef and engineRef, but both are refs —
     * their identity never changes across renders (same object, .current mutates).
     * React's linter knows this and doesn't require refs in the dependency array.
     * An empty array means: run this effect once on mount, clean up on unmount.
     */
    return canvasRef
}