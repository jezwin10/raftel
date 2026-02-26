/**
 * Home page.
 *
 * Serves as the landing overview of the Raftel Platform.
 * Content-only component — no routing or layout logic.
 */
import { Section } from "../components/Section.tsx"
import { Card } from "../components/Card"
// import { Stack } from "../components/Stack"
// import { Grid } from "../components/Grid"
// import {Button} from "../components/Button.tsx";

export function HomePage() {
    return (
        <Section title="Home">
            <Card>
                Self-hosted infrastructure. Clean architecture. Simulation engineering.
            </Card>
        </Section>
    )
}