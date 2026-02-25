/**
 * Persistent application layout.
 *
 * - Renders Header and Footer once.
 * - Wraps routed page content.
 *
 * Keeps structural concerns separate from routing logic.
 */

import type { ReactNode } from "react"
import { Header } from "./Header"
import { Footer } from "./Footer"

type Props = {
    children: ReactNode
}

export function Layout({ children }: Props) {
    return (
        <div className="app">
            <Header />
            <main>{children}</main>
            <Footer />
        </div>
    )
}
