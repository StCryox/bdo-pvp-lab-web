import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { netlifyHeaders } from './config/netlifyHeaders.ts'

const netlifyHeadersFile = (apiBaseUrl: string | undefined): Plugin => ({
  name: 'netlify-headers',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: '_headers', source: netlifyHeaders(apiBaseUrl) })
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    netlifyHeadersFile(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}))
