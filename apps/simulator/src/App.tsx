import { useSimulation } from './application/useSimulation.ts'
import { BodyInfoPanel } from './components/BodyInfoPanel.tsx'

/**
 * Speed presets shown as quick-select buttons alongside the slider.
 * Each entry is a [label, value] pair.
 *
 * When the current speed matches a preset value exactly, that button
 * is highlighted. The slider and buttons stay in sync because both
 * read from and write to the same `speed` state in the hook.
 */
const SPEED_PRESETS: [string, number][] = [
    ['1×', 1],
    ['2×', 2],
    ['3×', 3],
    ['5×', 5],
]

export function App() {
    const {
        canvasRef,
        isPaused,
        togglePause,
        speed,
        setSpeed,
        selectedBodyId,
        clearSelection,
    } = useSimulation()

    return (
        /*
         * position: relative on the outer container is required so that
         * the BodyInfoPanel (position: absolute) is positioned relative
         * to this container, not the viewport.
         *
         * Without this, `position: absolute` on the panel would walk up
         * the DOM tree until it found a positioned ancestor — likely the
         * viewport — and position itself there instead.
         */
        <div style={{
            position:        'relative',
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
                style={{
                    display: 'block',
                    borderRadius: '4px',
                    /**
                     * cursor: crosshair gives the user a visual affordance
                     * that the canvas is interactive/clickable.
                     */
                    cursor: 'crosshair',
                }}
            />

            {/* Controls bar */}
            <div style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '24px',
                color:       '#B0BEC5',
                fontFamily:  'monospace',
                fontSize:    '13px',
            }}>

                {/* Pause / Resume */}
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

                {/* Divider */}
                <span style={{ color: '#263238' }}>|</span>

                {/* Speed preset buttons */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: '#546E7A', marginRight: '4px' }}>Speed</span>
                    {SPEED_PRESETS.map(([label, value]) => (
                        <button
                            key={value}
                            onClick={() => setSpeed(value)}
                            style={{
                                padding:         '4px 10px',
                                backgroundColor: speed === value ? '#4FC3F7' : '#1C2A32',
                                color:           speed === value ? '#0d0d1a' : '#78909C',
                                border:          `1px solid ${speed === value ? '#4FC3F7' : '#263238'}`,
                                borderRadius:    '4px',
                                cursor:          'pointer',
                                fontFamily:      'monospace',
                                fontSize:        '12px',
                                transition:      'all 0.1s',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Fine-control slider */}
                <input
                    type="range"
                    min={0.25}
                    max={8}
                    step={0.25}
                    value={speed}
                    onChange={e => setSpeed(Number(e.target.value))}
                    style={{ width: '100px', accentColor: '#4FC3F7' }}
                    title={`${speed}×`}
                />
                <span style={{ minWidth: '36px', color: '#546E7A' }}>{speed}×</span>

            </div>

            {/* Body info panel — only rendered when a body is selected */}
            {selectedBodyId && (
                <BodyInfoPanel
                    bodyId={selectedBodyId}
                    onClose={clearSelection}
                />
            )}
        </div>
    )
}

export default App