import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Für Deployment in einem Unterordner (z.B. Shared-Hosting unter /imkerei/)
  // beim Bauen setzen: VITE_BASE_PATH=/imkerei/ npm run build
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
