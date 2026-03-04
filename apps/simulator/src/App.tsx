import { useSimulation } from './application/useSimulation.ts'

/**
 * App — root component of the simulator.
 *
 * Deliberately thin. This component has one job: declare the canvas
 * element and hand its ref to the useSimulation hook. All simulation
 * logic lives in the hook; all rendering logic lives in CanvasRenderer.
 *
 * This is the React realisation of the architecture diagram:
 *   App (component) → useSimulation (hook) → SimulationEngine (application)
 *                                          → CanvasRenderer (infrastructure)
 *                                                          ↑
 *                                                     canvas ref
 *
 * --- WHY ARE WIDTH AND HEIGHT SET AS ATTRIBUTES, NOT CSS? ---
 * The canvas element has two separate size concepts:
 *
 *   1. Intrinsic resolution — set by the `width` and `height` HTML
 *      attributes. This is the actual pixel grid the canvas draws into.
 *      Defaults to 300×150 if not set.
 *
 *   2. Display size — set by CSS. This stretches or shrinks how the
 *      canvas appears on screen, like stretching a photo.
 *
 * If you only set CSS dimensions and not the attributes, the canvas
 * renders at 300×150 and gets stretched — everything looks blurry.
 * Setting both keeps them in sync and produces crisp output.
 */

export function App() {
    const canvasRef = useSimulation()

    return (
        <div style={{
            display:         'flex',
            justifyContent:  'center',
            alignItems:      'center',
            width:           '100vw',
            height:          '100vh',
            backgroundColor: '#0d0d1a',
            margin:          0,
        }}>
            <canvas
                ref={canvasRef}
                width={1000}
                height={1000}
                style={{
                    display: 'block',
                    borderRadius: '4px',
                }}
            />
        </div>
    )
}

export default App