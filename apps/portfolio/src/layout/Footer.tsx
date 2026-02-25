/**
 * Application footer.
 *
 * - Displays persistent site-level metadata.
 * - Remains visible across all routes.
 */

export function Footer() {
    return (
        <footer>
            <small>© {new Date().getFullYear()} Raftel Platform</small>
        </footer>
    )
}