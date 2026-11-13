import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

// The apps-menu pane is a Jekyll/adopter INCLUDE source (PRD 5), not a served
// page: it lives in public/ so consumers can read it, but Vite copies public/
// verbatim, so it landed in dist/ where the post-build audit grades every
// .html as a page (no <head> -> FAIL). Drop it from the served tree; the
// source in public/ is untouched.
function dropPartialFromDist() {
  return {
    name: 'drop-partial-from-dist',
    closeBundle() {
      const p = resolve(HERE, 'dist', 'apps-menu.html')
      if (existsSync(p)) rmSync(p)
    },
  }
}

export default defineConfig({
  plugins: [react(), dropPartialFromDist()],
  build: {
    outDir: 'dist',
    // Performance optimizations
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Separate vendor chunk for better caching. vite 8 is rolldown-based:
        // manualChunks must be a FUNCTION (the object form vite <=7 accepted is
        // rejected), and minify defaults to oxc (esbuild is unbundled).
        manualChunks(id) {
          if (id.replace(/\\/g, '/').includes('node_modules/react')) return 'vendor'
        },
      },
    },
  },
  // Hint to browsers about preloaded resources
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
