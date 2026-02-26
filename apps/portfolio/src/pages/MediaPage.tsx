/**
 * Media Page.
 *
 * Access to request media, plex, and controlled access
 * Will have routing for plex and overseerr.
 */
import { Section } from "../components/Section"
import { Card } from "../components/Card"

export function MediaPage() {
    return (
        <Section title="Media">
            <Card>
                Overseerr, Plex integration, and controlled access model.
            </Card>
        </Section>
    )
}