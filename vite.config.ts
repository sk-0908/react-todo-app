import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // デフォルトのポートを3000に設定
    strictPort: false,
    open: true,
  },
})
