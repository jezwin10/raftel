/**
 * 404 page.
 *
 * Serves as the landing page for any invalid redirections.
 * Content-only component — no routing or layout logic.
 */
import { Section } from "../components/Section.tsx"
import { Card } from "../components/Card"

export function NotFoundPage() {
    return (
        <Section title="Page Not Found">
            <Card>
                The requested page could not be found.
            </Card>
        </Section>
    )
}