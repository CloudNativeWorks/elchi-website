import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index:        resolve(__dirname, 'index.html'),
        features:     resolve(__dirname, 'features.html'),
        architecture: resolve(__dirname, 'architecture.html'),
        docs:         resolve(__dirname, 'docs.html'),
      },
    },
  },
});
