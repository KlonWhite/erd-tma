import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: ['es2020', 'safari14'],
  },
  assetsInclude: ['**/*.png@webp'],
  server: {
    // cloudflared uses 127.0.0.1; default Vite often binds [::1] only → 502
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
