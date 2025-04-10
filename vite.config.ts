import checker from 'vite-plugin-checker'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint . --ext .ts,.tsx,.js,.jsx' // Ensure extensions are set here
      }
    })
  ],
  server: {
    port: 3000 // Optional: Set a custom port
  }
})
