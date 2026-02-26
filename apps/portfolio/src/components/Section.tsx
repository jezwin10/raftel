/**
 * Structural section wrapper.
 *
 * - Provides vertical spacing.
 * - Optionally renders a section title.
 *
 * Encourages consistent page structure.
 */

import type { ReactNode } from "react"

type Props = {
    title?: string
    children: ReactNode
}

export function Section({ title, children }: Props) {
    return (
        <section className="section">
            {title && <h2 className="section-title">{title}</h2>}
            <div className="section-content">{children}</div>
        </section>
    )
}