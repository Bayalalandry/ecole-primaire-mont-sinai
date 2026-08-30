import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/jspdf')) {
            return 'pdf-vendor';
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'chart-vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
  },
})
