import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      host: true,
      allowedHosts: true,
      strictPort: false,
      proxy: { '/exec': { target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8787', changeOrigin: true } },
    },
    test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', css: true },
  };
});
