import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.VITE_FIRECRAWL_API_KEY || env.FIRECRAWL_API_KEY || 'fc-850489a97c4f40989599c7dcab34bbc9'
  return {
    plugins: [react()],
    define: {
      'process.env.FIRECRAWL_API_KEY': JSON.stringify(apiKey),
    },
  }
})

