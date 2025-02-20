import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '18' }]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_NODE_ENV === 'production' 
          ? 'https://skip-go-fast-solver-7uhj8sjcc-chalabi.vercel.app'
          : 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
}) 