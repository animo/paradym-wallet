import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  platform: 'neutral',
  dts: true,
  unbundle: true,
  sourcemap: true,
  loader: {
    '.js': 'jsx',
    '.png': 'binary',
    '.otf': 'binary',
  },
})
