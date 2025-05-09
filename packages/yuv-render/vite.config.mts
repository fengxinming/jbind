import { camelize } from 'camel-kit';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import pluginBuildChunk from 'vite-plugin-build-chunk';
import pluginCombine from 'vite-plugin-combine';

import { name } from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginCombine({
      src: './src/*.ts',
      target: './src/index.ts',
      exports: 'all',
      dts: true
    }) as unknown as PluginOption,
    pluginBuildChunk({
      logLevel: 'TRACE',
      build: {
        chunk: 'index.mjs',
        name: camelize(name, { pascalCase: true }),
        format: 'umd',
        minify: false
      }
    }) as PluginOption
  ],
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['es', 'cjs'],
      fileName: '[name]'
    },
    minify: false
  }
});
