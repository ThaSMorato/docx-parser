import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  outDir: 'dist',
  target: 'es2022',
  keepNames: true,
  treeshake: true,
  external: ['jszip'],
});
