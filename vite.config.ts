import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    preact(),
    dts({ insertTypesEntry: true }),
    cssInjectedByJsPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChatWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `chat-widget.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'chat-widget.[ext]'
      }
    },
    minify: 'terser',
    sourcemap: true
  }
});
