export function App() {
    return (
        <div className="app">
            <header>
                <h1>Raftel Platform</h1>
                <nav>
                    <a href="/">Home</a>
                    <a href="/infrastructure">Infrastructure</a>
                    <a href="/media">Media</a>
                    <a href="/simulator">Simulator</a>
                    <a href="/contact">Contact</a>
                </nav>
            </header>

            <main>
                <h2>Home</h2>
                <p>Self-hosted infrastructure. Clean architecture. Simulation engineering.</p>
            </main>

            <footer>
                <small>© {new Date().getFullYear()} Raftel Platform</small>
            </footer>
        </div>
    )
}