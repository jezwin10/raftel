import { useSimulation } from './application/useSimulation.ts'

/**
 * App — root component.
 *
 * Now destructures the full SimulationControls interface from useSimulation,
 * and renders a control panel alongside the canvas.
 *
 * --- WHY IS THE UI IN App.tsx AND NOT IN THE HOOK? ---
 * The hook manages simulation logic and exposes control functions.
 * The component decides how to present those controls visually.
 * This separation means you could swap the UI (buttons, keyboard shortcuts,
 * a different slider library) without touching simulation logic, and vice versa.
 *
 * --- REACT STATE AND RE-RENDERS ---
 * When the user clicks pause or moves the slider, React re-renders App.
 * This is fine — the re-render is cheap (just the controls overlay) and
 * the animation loop is not affected because it reads from refs, not
 * from anything React controls.
 *
 * The canvas itself does not re-render in the React sense. It's an
 * imperative surface that the hook updates directly every rAF tick.
 * React only manages the control panel elements.
 */

export function App() {
    const { canvasRef, isPaused, togglePause, speed, setSpeed } = useSimulation()

    return (
        <div style={{
            display:         'flex',
            flexDirection:   'column',
            justifyContent:  'center',
            alignItems:      'center',
            width:           '100vw',
            height:          '100vh',
            backgroundColor: '#0d0d1a',
            margin:          0,
            gap:             '16px',
        }}>
            <canvas
                ref={canvasRef}
                width={1000}
                height={1000}
                style={{ display: 'block', borderRadius: '4px' }}
            />

            {/*
              * Controls panel.
              *
              * Deliberately minimal styling — this is a demo canvas app,
              * not the portfolio UI. Inline styles keep it self-contained.
              */}
            <div style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '24px',
                color:          '#B0BEC5',
                fontFamily:     'monospace',
                fontSize:       '13px',
            }}>

                {/* Pause / Resume button */}
                <button
                    onClick={togglePause}
                    style={{
                        padding:         '6px 16px',
                        backgroundColor: isPaused ? '#4FC3F7' : '#37474F',
                        color:           isPaused ? '#0d0d1a' : '#B0BEC5',
                        border:          'none',
                        borderRadius:    '4px',
                        cursor:          'pointer',
                        fontFamily:      'monospace',
                        fontSize:        '13px',
                        transition:      'background-color 0.15s',
                    }}
                >
                    {isPaused ? '▶  Resume' : '⏸  Pause'}
                </button>

                {/*
                  * Speed slider.
                  *
                  * Range: 0.25× to 8×, step 0.25.
                  * The value label updates live as the slider moves because
                  * `speed` is React state — any change triggers a re-render
                  * of this label, showing the new value.
                  *
                  * The slider's onChange calls setSpeed, which updates both
                  * the state (for the label) and the ref (for the loop).
                  */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Speed
                    <input
                        type="range"
                        min={0.25}
                        max={8}
                        step={0.25}
                        value={speed}
                        onChange={e => setSpeed(Number(e.target.value))}
                        style={{ width: '120px', accentColor: '#4FC3F7' }}
                    />
                    <span style={{ minWidth: '36px' }}>{speed}×</span>
                </label>

            </div>
        </div>
    )
}

export default App