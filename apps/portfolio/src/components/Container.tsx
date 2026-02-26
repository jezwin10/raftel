/**
 * Layout constraint component.
 *
 * - Centers content horizontally.
 * - Enforces max width.
 * - Applies consistent horizontal padding.
 *
 * Used to wrap page content.
 */

import type { ReactNode } from "react"

type Props = {
    children: ReactNode
}

export function Container({ children }: Props) {
    return <div className="container">{children}</div>
}