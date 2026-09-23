import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills({ protocolImports: false })],
  base: './',
  server: { port: 5173, host: true },
  build: { outDir: 'dist', sourcemap: false }
})
