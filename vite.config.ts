import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      react(),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': {
        VITE_API_URL: JSON.stringify(env.VITE_API_URL),
        VITE_APP_TITLE: JSON.stringify(env.VITE_APP_TITLE),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'react-vendor'
              if (id.includes('he')) return 'utils'
              return 'vendor'
            }
          },
        },
      },
    },
  }
})
