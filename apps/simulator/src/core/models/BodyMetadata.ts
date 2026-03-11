/**
 * BodyMetadata
 *
 * Static display data for each celestial body, keyed by body ID.
 *
 * --- WHY THIS IS SEPARATE FROM CelestialBody ---
 * CelestialBody is a physics model — it contains only the state the
 * simulation engine needs to compute: mass, position, velocity.
 * Adding display strings or human-readable labels there would violate
 * the separation of concerns the architecture is built on.
 *
 * This module belongs in /core/models because the data describes
 * real-world properties of the bodies — it's domain knowledge, not
 * infrastructure or application logic. It has no dependencies.
 *
 * Any layer that needs to display body information imports from here.
 * The physics engine never touches it.
 */

export interface BodyMetadata {
    displayName:   string
    description:   string
    mass:          string
    orbitalPeriod: string
}

/**
 * Indexed by the same body IDs used in INITIAL_BODIES in useSimulation.
 * If a body exists in the simulation but has no entry here, the UI
 * should fall back gracefully rather than crash — we handle that in
 * the panel component.
 */
export const BODY_METADATA: Record<string, BodyMetadata> = {
    sun: {
        displayName:   'The Sun',
        description:   'The star at the centre of our solar system, ' +
            'containing 99.86% of the system\'s total mass.',
        mass:          '1.989 × 10³⁰ kg',
        orbitalPeriod: 'N/A',
    },
    earth: {
        displayName:   'Earth',
        description:   'The third planet from the Sun and the only known ' +
            'body in the universe confirmed to harbour life.',
        mass:          '5.972 × 10²⁴ kg',
        orbitalPeriod: '365.25 days',
    },
    mars: {
        displayName:   'Mars',
        description:   'The fourth planet from the Sun, known as the Red ' +
            'Planet due to iron oxide on its surface.',
        mass:          '6.39 × 10²³ kg',
        orbitalPeriod: '687 days',
    },
    jupiter: {
        displayName:   'Jupiter',
        description:   'The largest planet in the solar system — a gas giant ' +
            'with a mass greater than all other planets combined.',
        mass:          '1.898 × 10²⁷ kg',
        orbitalPeriod: '11.86 years',
    },
}