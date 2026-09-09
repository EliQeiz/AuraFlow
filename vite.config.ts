import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name(moduleId) {
                const id = moduleId.replaceAll('\\', '/')
                if (id.includes('/@firebase/firestore/')) return 'firebase-data'
                if (id.includes('/@firebase/auth/')) return 'firebase-auth'
                if (id.includes('/node_modules/react-dom/')) return 'react-dom'
                return null
              },
            },
          ],
        },
      },
    },
  },
})
