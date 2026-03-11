import { BODY_METADATA } from '../core/models/BodyMetadata.ts'

/**
 * BodyInfoPanel
 *
 * Displays static metadata for a selected celestial body.
 * Rendered as a React overlay on top of the canvas — not drawn onto
 * the canvas itself. This keeps text and layout in the React world,
 * where accessibility, font rendering, and styling are straightforward.
 *
 * --- PROPS ---
 * bodyId       — the ID of the selected body (matches BODY_METADATA keys)
 * onClose      — called when the user dismisses the panel
 *
 * --- GRACEFUL FALLBACK ---
 * If bodyId has no entry in BODY_METADATA (e.g. a future body without
 * metadata yet), the panel renders a minimal fallback rather than crashing.
 * This is a deliberate defensive pattern — the simulation can add bodies
 * independently of the metadata map being updated.
 */

interface Props {
    bodyId:  string
    onClose: () => void
}

export function BodyInfoPanel({ bodyId, onClose }: Props) {
    const metadata = BODY_METADATA[bodyId]

    return (
        <div style={{
            position:        'absolute',
            top:             '24px',
            right:           '24px',
            width:           '260px',
            backgroundColor: 'rgba(13, 13, 26, 0.92)',
            border:          '1px solid rgba(79, 195, 247, 0.25)',
            borderRadius:    '8px',
            padding:         '20px',
            color:           '#B0BEC5',
            fontFamily:      'monospace',
            fontSize:        '13px',
            backdropFilter:  'blur(8px)',
            /**
             * pointer-events: auto ensures clicks on the panel don't
             * propagate to the canvas behind it. Without this, clicking
             * inside the panel would also trigger the canvas click handler,
             * potentially deselecting the body immediately.
             */
            pointerEvents:   'auto',
        }}>
            {/* Header row — name and close button */}
            <div style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'flex-start',
                marginBottom:   '14px',
            }}>
                <span style={{
                    color:      '#ECEFF1',
                    fontSize:   '15px',
                    fontWeight: 'bold',
                }}>
                    {metadata?.displayName ?? bodyId}
                </span>

                <button
                    onClick={onClose}
                    style={{
                        background:  'none',
                        border:      'none',
                        color:       '#546E7A',
                        cursor:      'pointer',
                        fontSize:    '16px',
                        lineHeight:  1,
                        padding:     '0 0 0 8px',
                    }}
                    aria-label="Close panel"
                >
                    ✕
                </button>
            </div>

            {metadata ? (
                <>
                    {/* Description */}
                    <p style={{
                        margin:       '0 0 16px',
                        lineHeight:   '1.6',
                        color:        '#90A4AE',
                        fontSize:     '12px',
                    }}>
                        {metadata.description}
                    </p>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <StatRow label="Mass"           value={metadata.mass}          />
                        <StatRow label="Orbital period" value={metadata.orbitalPeriod} />
                    </div>
                </>
            ) : (
                <p style={{ color: '#546E7A', margin: 0 }}>
                    No data available for this body.
                </p>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// StatRow — small internal component for a label/value pair
// ---------------------------------------------------------------------------

/**
 * Extracted as its own component because the pattern repeats and we may
 * add more stat rows later. Keeping it co-located in this file (rather
 * than a separate file) is reasonable while it's only used here.
 */
function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            display:       'flex',
            justifyContent: 'space-between',
            gap:           '8px',
        }}>
            <span style={{ color: '#546E7A' }}>{label}</span>
            <span style={{ color: '#ECEFF1', textAlign: 'right' }}>{value}</span>
        </div>
    )
}