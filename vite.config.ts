import { defineConfig } from 'vitest/config';

/**
 * GitHub Pages serves project sites from `/<repo>/`. The deploy workflow passes the exact path
 * reported by `actions/configure-pages`, so forks with another name work too.
 */
const PAGES_BASE = process.env.BASE_PATH ?? '/vyra-energy/';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? PAGES_BASE : '/',
  build: {
    target: 'es2022',
    sourcemap: true,
    // three.js lives in the lazily imported scene chunk; the page text renders without it.
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Rendering and DOM wiring need a real browser + GPU; behaviour lives in src/lib.
      exclude: ['src/main.ts', 'src/scene/**', 'src/ui/**'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        'src/lib/**': { lines: 90, statements: 90, functions: 90, branches: 85 },
      },
    },
  },
}));
