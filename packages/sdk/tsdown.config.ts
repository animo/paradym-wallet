import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  loader: {
    '.js': 'jsx',
    '.png': 'binary',
    '.otf': 'binary',
  },
})
