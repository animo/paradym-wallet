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
          '@easypid': path.resolve(import.meta.dirname, 'src'),
        },
      },
    ],
    [
      '@tamagui/babel-plugin',
      {
        // The static loader's esbuild-register/tsconfig-paths shim can't
        // resolve workspace package names. Pass an absolute file path for
        // @package/ui so it's treated as a local file and require()d directly.
        // @package/app is omitted because it only re-exports/composes from
        // @package/ui and contributes no styled() components of its own.
        components: [path.resolve(import.meta.dirname, '../../packages/ui/src/index.ts'), 'tamagui'],
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
