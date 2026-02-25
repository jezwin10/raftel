/**
 * Application entry point.
 *
 * - Bootstraps React root.
 * - Wraps App in BrowserRouter for client-side routing.
 * - Imports global styles and design tokens.
 *
 * This file should remain minimal and infrastructure-focused.
 */

import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "./App"
import "./styles/global.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
)