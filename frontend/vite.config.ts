import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 9999,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9998',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:9998',
        changeOrigin: true,
      },
      '/sitemap.xml': {
        target: 'http://127.0.0.1:9998',
        changeOrigin: true,
      },
      '/feed.xml': {
        target: 'http://127.0.0.1:9998',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\')) {
            return 'vendor-react';
          }
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('zustand')) return 'vendor-zustand';
          if (id.includes('lucide-react')) return 'vendor-lucide';
          if (id.includes('react-hot-toast')) return 'vendor-toast';
          if (id.includes('axios')) return 'vendor-http';
          if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('recharts') || id.includes('chart')) return 'vendor-charts';
          if (id.includes('@radix-ui') || id.includes('react-helmet')) return 'vendor-ui-primitives';
          return 'vendor-misc';
        },
      },
    },
  },
});
