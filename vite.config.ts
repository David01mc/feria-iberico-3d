/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      output: {
        // Librerías en trozos propios: se descargan en paralelo y un cambio en la app no invalida
        // la caché del navegador de los ~1,8 MB de three.js y compañía.
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/, priority: 3 },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 2,
            },
            { name: 'r3f', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
