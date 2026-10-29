import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
