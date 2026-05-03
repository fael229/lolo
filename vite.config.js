import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/moneroo': {
        target: 'https://api.moneroo.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moneroo/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_MONEROO_SECRET_KEY}`,
        }
      }
    }
  }
})
