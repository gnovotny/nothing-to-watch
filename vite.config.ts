import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import analyzer from 'vite-bundle-analyzer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    glsl({
      compress: true,
    }),
    analyzer(),
  ],
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        standalone: resolve(__dirname, 'standalone', 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './app'),
      '√': resolve(__dirname, './voroforce'),
      '~': resolve(__dirname),
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
    headers: {
      // 'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})
