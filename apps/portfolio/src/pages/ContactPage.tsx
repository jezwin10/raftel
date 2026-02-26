/**
 * Contact page.
 *
 * How to get in touch with me.
 * Content-only component — no routing or layout logic.
 */
import { Section } from "../components/Section.tsx";
import { Card } from "../components/Card.tsx";

export function ContactPage() {
    return (
        <Section title="Contact">
            <Card>
                Professional inquiries and technical discussions.
            </Card>
        </Section>
    )
}