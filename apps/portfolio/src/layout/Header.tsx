import { NavLink } from "react-router-dom"

export function Header() {
    return (
        <header>
            <h1>Raftel Platform</h1>
            <nav>
                <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Home
                </NavLink>
                <NavLink to="/infrastructure" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Infrastructure
                </NavLink>
                <NavLink to="/media" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Media
                </NavLink>
                <NavLink to="/simulator" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Simulator
                </NavLink>
                <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Contact
                </NavLink>
            </nav>
        </header>
    )
}