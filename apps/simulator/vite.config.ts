import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  /**
   * Vitest configuration lives here rather than in a separate vitest.config.ts.
   * This keeps the toolchain unified — Vitest inherits the same plugin pipeline,
   * module resolution, and TypeScript handling as the main Vite build.
   *
   * `environment: 'node'` is correct for the physics core:
   * - Our core modules are pure TypeScript with no DOM dependencies.
   * - Node environment is faster and more predictable for pure logic tests.
   * - If/when we add rendering tests, we would switch to 'jsdom' or 'happy-dom'.
   *
   * `include` explicitly scopes test discovery to our tests directory,
   * preventing Vitest from accidentally picking up unrelated spec files.
   */
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
})