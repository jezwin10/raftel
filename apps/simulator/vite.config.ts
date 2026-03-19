import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    include:     ['src/tests/**/*.test.{ts,tsx}'],

    /**
     * Benchmark configuration.
     *
     * Kept separate from `include` so that `npm test` (regular test run)
     * does not execute benchmarks — they are slow by design and would make
     * the normal test feedback loop unusable.
     *
     * Run benchmarks explicitly with:
     *   npx vitest bench
     *
     * benchmark.include scopes discovery to the benchmarks directory,
     * preventing Vitest from treating .bench.ts files as regular tests.
     */
    benchmark: {
      include: ['src/benchmarks/**/*.bench.ts'],
    },
  },
})