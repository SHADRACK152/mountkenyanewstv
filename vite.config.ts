import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/article': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
