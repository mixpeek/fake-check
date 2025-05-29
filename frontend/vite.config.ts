import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/fake-check/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
