import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Plus besoin de proxy - Vercel gère les API routes nativement
  // En dev local, on peut garder le proxy si besoin :
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Vercel dev server
        changeOrigin: true,
      },
    },
  },
})