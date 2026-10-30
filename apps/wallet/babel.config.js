import path from 'node:path'

export default {
  presets: ['babel-preset-expo'],
  plugins: [
    // 'babel-plugin-syntax-hermes-parser',
    [
      'module-resolver',
      {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        alias: {
          '@package/app': path.resolve(import.meta.dirname, '../../packages/app/src'),
          '@package/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
          '@package/scanner': path.resolve(import.meta.dirname, '../../packages/scanner/src'),
          '@package/translations': path.resolve(import.meta.dirname, '../../packages/translations/src'),
          '@package/utils': path.resolve(import.meta.dirname, '../../packages/utils/src'),
          '@app': path.resolve(import.meta.dirname, 'src'),
        },
      },
    ],
    // Translations
    '@lingui/babel-plugin-lingui-macro',
    // used for bottom sheet
    'react-native-reanimated/plugin',
  ],
}
