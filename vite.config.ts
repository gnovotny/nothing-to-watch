import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig, loadEnv } from 'vite'
import analyzer from 'vite-bundle-analyzer'
import glsl from 'vite-plugin-glsl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      react({}),
      tailwindcss(),
      glsl({
        minify: Boolean(env.VITE_COMPRESS_GLSL),
      }),
      ...(env.VITE_ANALYZE_BUNDLE ? [analyzer()] : []),
    ],
    build: {
      rollupOptions: {
        input: {
          app: resolve(__dirname, 'index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './app'),
        '√': resolve(__dirname, './voroforce'),
      },
    },
    server: {
      host: 'localhost',
      port: 3000,
      headers: {
        'Cross-Origin-Embedder-Policy': 'credentialless', // should be 'require-corp' but 'credentialless' allows for img hotlinking
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  }
})
