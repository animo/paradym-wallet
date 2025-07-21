import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-json'

export default defineConfig({
  sourceLocale: 'en',
  locales: ['nl', 'en', 'fi', 'sw'],
  format: formatter({ style: 'lingui' }),
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['<rootDir>/src', '<rootDir>/../../packages'],
      exclude: ['**/node_modules/**', 'node_modules'],
    },
  ],
  fallbackLocales: {
    default: 'en',
  },
})
