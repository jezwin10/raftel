/**
 * Vertical layout primitive.
 *
 * - Applies consistent spacing between children.
 * - Prevents margin-based layout hacks.
 * - Usage Example:
 * <Stack gap="md">
 *   <Card>Service 1</Card>
 *   <Card>Service 2</Card>
 *   <Card>Service 3</Card>
 * </Stack>
 */

import type { ReactNode } from "react"

type Props = {
    children: ReactNode
    gap?: "sm" | "md" | "lg"
}

export function Stack({ children, gap = "md" }: Props) {
    return (
        <div className={`stack stack-${gap}`}>
            {children}
        </div>
    )
}