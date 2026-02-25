import { Routes, Route } from "react-router-dom"
import { Layout } from "./layout/Layout"
import { HomePage } from "./pages/HomePage"
import { InfrastructurePage } from "./pages/InfrastructurePage"
import { MediaPage } from "./pages/MediaPage"
import { SimulatorPage } from "./pages/SimulatorPage"
import { ContactPage } from "./pages/ContactPage"
import { NotFoundPage } from "./pages/NotFoundPage"

export function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/infrastructure" element={<InfrastructurePage />} />
                <Route path="/media" element={<MediaPage />} />
                <Route path="/simulator" element={<SimulatorPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Layout>
    )
}