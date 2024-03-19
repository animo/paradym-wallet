/* eslint-disable */

module.exports = function (api) {
  api.cache(false)
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['../..'],
          alias: {
            // define aliases to shorten the import paths
            app: '../../packages/app',
            '@internal/ui': '../../packages/ui',
            '@internal/agent': '../../packages/agent',
            '@internal/utils': '../../packages/utils',
          },
          extensions: ['.js', '.jsx', '.tsx', '.ios.js', '.android.js'],
        },
      ],
      // if you want reanimated support
      // 'react-native-reanimated/plugin',
      [
        '@tamagui/babel-plugin',
        {
          components: ['@internal/ui', 'tamagui'],
          config: './tamagui.config.ts',
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
    ],
  }
}
