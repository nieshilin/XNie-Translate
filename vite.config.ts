import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    globals: true,
    css: true
  }
})
