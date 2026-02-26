/**
 * Simulator Page.
 *
 * Rendering of a solar system simulation - career development project.
 * Will contain some layout logic along with content.
 */
import { Section } from "../components/Section.tsx";
import { Card } from "../components/Card";

export function SimulatorPage() {
    return (
        <Section title="Simulator">
            <Card>
                Deterministic physics engine with rendering abstraction
            </Card>
        </Section>
    )
}