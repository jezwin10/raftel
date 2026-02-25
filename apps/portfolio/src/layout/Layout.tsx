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
