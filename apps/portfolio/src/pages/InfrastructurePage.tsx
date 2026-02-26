/**
 * Infrastructure Page.
 *
 * Overview of the infrastructure used to create this site and its systems
 * Content-only component — no routing or layout logic.
 */
import { Section } from "../components/Section"
import { Card } from "../components/Card"

export function InfrastructurePage() {
    return (
        <Section title="Infrastructure">
            <Card>
                Containerised services behind NGINX reverse proxy.
            </Card>
        </Section>
    )
}