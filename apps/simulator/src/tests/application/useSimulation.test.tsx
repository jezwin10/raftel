import { useEffect, useRef, useState } from 'react'
import { SimulationEngine } from '../simulation-engine/SimulationEngine.ts'
import { CanvasRenderer, bodyRadius } from '../infrastructure/rendering/CanvasRenderer.ts'
import { Vector2 } from '../core/math/Vector2.ts'
import type { CelestialBody } from '../core/models/CelestialBody.ts'

const SCALE           = 6.0e-10
const BASE_DT         = 3_600 * 14
const MAX_TRAIL_LENGTH = 200

const INITIAL_BODIES: CelestialBody[] = [
    {
        id:       'sun',
        mass:     1.989e30,
        position: new Vector2(0, 0),
        velocity: new Vector2(0, 0),
    },
    {
        id:       'earth',
        mass:     5.972e24,
        position: new Vector2(1.496e11, 0),
        velocity: new Vector2(0, 29_783),
    },
    {
        id:       'mars',
        mass:     6.39e23,
        position: new Vector2(2.279e11, 0),
        velocity: new Vector2(0, 24_077),
    },
    {
        id:       'jupiter',
        mass:     1.898e27,
        position: new Vector2(7.785e11, 0),
        velocity: new Vector2(0, 13_069),
    },
]

export interface SimulationControls {
    canvasRef:      React.RefObject<HTMLCanvasElement | null>
    isPaused:       boolean
    togglePause:    () => void
    speed:          number
    setSpeed:       (value: number) => void
    selectedBodyId: string | null
    clearSelection: () => void
}

export function useSimulation(): SimulationControls {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const engineRef = useRef<SimulationEngine | null>(null)
    const trailsRef = useRef<Map<string, Vector2[]>>(
        new Map(INITIAL_BODIES.map(b => [b.id, []]))
    )

    // Pause
    const [isPaused, setIsPaused] = useState(false)
    const isPausedRef             = useRef(false)

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current
        setIsPaused(isPausedRef.current)
    }

    // Speed
    const [speed, setSpeedState] = useState(1)
    const speedRef               = useRef(1)

    const setSpeed = (value: number) => {
        speedRef.current = value
        setSpeedState(value)
    }

    // Selected body
    const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null)
    const clearSelection = () => setSelectedBodyId(null)


    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        engineRef.current = new SimulationEngine(INITIAL_BODIES)
        const renderer    = new CanvasRenderer(ctx)

        let animationId: number

        const loop = () => {
            if (!isPausedRef.current) {
                engineRef.current?.step(BASE_DT * speedRef.current)

                const bodies = engineRef.current?.getBodies() ?? []
                for (const body of bodies) {
                    const trail = trailsRef.current.get(body.id)
                    if (trail) {
                        trail.push(body.position)
                        if (trail.length > MAX_TRAIL_LENGTH) trail.shift()
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


        /**
         * When a click fires on the canvas, we receive pixel coordinates
         * relative to the page (clientX/Y). We need simulation coordinates.
         *
         * The transform applied during rendering is:
         *   screenX = centerX + body.position.x * scale
         *   screenY = centerY - body.position.y * scale
         *
         * Inverting that transform gives us simulation coordinates:
         *   simX = (screenX - centerX) / scale
         *   simY = (centerY - screenY) / scale   ← note the Y inversion
         *
         * getBoundingClientRect() gives us the canvas position and dimensions
         * on screen, accounting for any CSS scaling or page scroll.
         *
         * We then iterate over every body and check whether the click falls
         * within its rendered radius. This is a simple 2D distance check:
         *   distance = √((simX - body.x)² + (simY - body.y)²)
         *   hit if distance ≤ bodyRadius(body) / scale
         *
         * We divide the pixel radius by scale to compare in simulation space.
         * Alternatively we could convert body positions to screen space and
         * compare in pixels — both are equivalent, this is slightly cleaner.
         *
         * If multiple bodies overlap, we select the one whose centre is
         * closest to the click point (nearest-body-wins).
         */
        const handleClick = (event: MouseEvent) => {
            const bodies = engineRef.current?.getBodies() ?? []
            if (bodies.length === 0) return

            const rect    = canvas.getBoundingClientRect()
            const screenX = event.clientX - rect.left
            const screenY = event.clientY - rect.top

            const centerX = canvas.width  / 2
            const centerY = canvas.height / 2

            const simX = (screenX - centerX) / SCALE
            const simY = (centerY - screenY) / SCALE

            let closestId:   string | null = null
            let closestDist: number        = Infinity

            for (const body of bodies) {
                const dx       = simX - body.position.x
                const dy       = simY - body.position.y
                const dist     = Math.sqrt(dx * dx + dy * dy)

                // Convert the pixel radius to simulation units for comparison.
                // We add a small tap target margin (× 3) so planets are
                // comfortably clickable without pixel-perfect precision.
                const hitRadius = (bodyRadius(body) * 3) / SCALE

                if (dist < hitRadius && dist < closestDist) {
                    closestDist = dist
                    closestId   = body.id
                }
            }

            // Clicking empty space clears the selection.
            setSelectedBodyId(closestId)
        }

        canvas.addEventListener('click', handleClick)

        return () => {
            cancelAnimationFrame(animationId)
            canvas.removeEventListener('click', handleClick)
        }
    }, [])

    return {
        canvasRef,
        isPaused,
        togglePause,
        speed,
        setSpeed,
        selectedBodyId,
        clearSelection,
    }
}