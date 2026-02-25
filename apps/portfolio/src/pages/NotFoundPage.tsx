/**
 * 404 page.
 *
 * Serves as the landing page for any invalid redirections.
 * Content-only component — no routing or layout logic.
 */

export function NotFoundPage() {
    return (
        <>
            <h2>404</h2>
            <p>The requested page could not be found.</p>
        </>
    )
}