import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/finder-doctor': {
        target: 'https://34.126.165.66',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})


