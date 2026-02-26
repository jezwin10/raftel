/**
 * Horizontal layout primitive.
 *
 * - Creates responsive column-based layouts.
 * - Centralizes grid spacing and behavior.
 * - Usage Example:
 * <Grid columns={3}>
 *   <Card>NGINX</Card>
 *   <Card>Docker</Card>
 *   <Card>Auth</Card>
 * </Grid>
 */

import type { ReactNode } from "react"

type Props = {
    children: ReactNode
    columns: 2 | 3 | 4
}

export function Grid({ children, columns = 3 }: Props) {
    return (
        <div className={`grid grid-${columns}`}>
            {children}
        </div>
    )
}