import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ecomof-ai/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react'
            }
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/delaunator/') || id.includes('/internmap/') || id.includes('/robust-predicates/')) {
              return 'vendor-charts'
            }
            if (id.includes('/katex/') || id.includes('/react-katex/')) {
              return 'vendor-math'
            }
            return 'vendor'
          }

          if (id.includes('/src/components/tabs/')) {
            if (id.includes('/HomeTab.jsx')) return 'tab-overview'
            if (id.includes('/EcoScreenTab.jsx') || id.includes('/ComparisonTab.jsx')) return 'tab-ecoscreen'
            if (id.includes('/PerformanceTab.jsx') || id.includes('/ScreeningTab.jsx')) return 'tab-performance'
            if (id.includes('/GasSepTab.jsx')) return 'tab-gassep'
            if (id.includes('/CatalysisLabTab.jsx')) return 'tab-catalysis'
            if (id.includes('/MOFLibraryTab.jsx') || id.includes('/LiteratureTab.jsx') || id.includes('/DataSourcesTab.jsx')) return 'tab-library'
            if (id.includes('/MethodsLimitationsTab.jsx') || id.includes('/ValidationTab.jsx') || id.includes('/ResourcesTab.jsx')) return 'tab-methodology'
            return 'tab-legacy'
          }

          if (id.includes('/src/components/charts/') || id.includes('/src/components/catalysis/')) {
            return 'feature-visualizations'
          }
          if (id.includes('/src/components/mof/')) {
            return 'feature-mof-tools'
          }
        },
      },
    },
  },
})
