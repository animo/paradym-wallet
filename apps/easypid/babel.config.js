import path from 'node:path'

export default {
  presets: ['babel-preset-expo'],
  plugins: [
    'babel-plugin-syntax-hermes-parser',
    [
      'module-resolver',
      {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        alias: {
          '@package/app': path.resolve(import.meta.dirname, '../../packages/app/src'),
          '@package/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
          '@package/scanner': path.resolve(import.meta.dirname, '../../packages/scanner/src'),
          '@package/translations': path.resolve(import.meta.dirname, '../../packages/translations/src'),
          '@package/secure-store': path.resolve(import.meta.dirname, '../../packages/secure-store'),
          '@package/utils': path.resolve(import.meta.dirname, '../../packages/utils/src'),
          '@package/agent': path.resolve(import.meta.dirname, '../../packages/agent/src'),
        },
      },
    ],
    [
      '@tamagui/babel-plugin',
      {
        // No idea why, but tamagui can't find the packages... :(
        components: ['@package/ui', '@package/app', 'tamagui'],
        config: './tamagui.config.ts',
        disableExtraction: process.env.NODE_ENV === 'development',
      },
    ],
    // Translations
    '@lingui/babel-plugin-lingui-macro',
    // used for bottom sheet
    'react-native-reanimated/plugin',
  ],
}
