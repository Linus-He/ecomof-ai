import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ecomof-ai/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/katex') || id.includes('react-katex')) return 'math-rendering'
          if (id.includes('components/methodology/version-docs')) return 'knowledge-base'
          if (id.includes('components/methodology/organic-acid-final')) return 'organic-acid-methodology'
          if (id.includes('components/methodology')) return 'methodology'
          if (id.includes('components/catalysis/organic-acid-final/trace-workbench') || id.includes('utils/organicAcidTrace')) return 'organic-acid-trace-workbench'
          if (id.includes('components/catalysis/organic-acid-final') || id.includes('utils/organicAcidFinalScreening')) return 'organic-acid-final'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
