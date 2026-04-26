import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const appNodeModules = path.resolve(__dirname, './node_modules');
const linkedUiRoot = path.resolve(__dirname, '../case-builder-ui');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['@case-builder/ui'],
  },
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: [linkedUiRoot,  __dirname],
     
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: /^react$/,
        replacement: path.resolve(appNodeModules, 'react'),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(appNodeModules, 'react/jsx-runtime.js'),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.resolve(appNodeModules, 'react/jsx-dev-runtime.js'),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(appNodeModules, 'react-dom'),
      },
      {
        find: /^react-dom\/client$/,
        replacement: path.resolve(appNodeModules, 'react-dom/client.js'),
      },
    ],
    dedupe: ['react', 'react-dom'],
    preserveSymlinks: false,
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
  },
});
