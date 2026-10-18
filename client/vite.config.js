import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/bybit-api': {
        target: 'https://api.bybit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bybit-api/, '')
      },
      '/bybit-ws': {
        target: 'wss://stream.bybit.com',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bybit-ws/, '')
      }
    }
  },
  optimizeDeps: {
    force: true,
    include: ['@sumsub/websdk']
  }
})
