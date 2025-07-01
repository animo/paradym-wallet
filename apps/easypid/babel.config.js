const path = require('node:path')

module.exports = (api) => {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'babel-plugin-syntax-hermes-parser',
      [
        'module-resolver',
        {
          extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
          alias: {
            '@package/app': path.resolve(__dirname, '../../packages/app/src'),
            '@package/ui': path.resolve(__dirname, '../../packages/ui/src'),
            '@package/scanner': path.resolve(__dirname, '../../packages/scanner/src'),
            '@package/secure-store': path.resolve(__dirname, '../../packages/secure-store'),
            '@package/utils': path.resolve(__dirname, '../../packages/utils/src'),
            '@package/agent': path.resolve(__dirname, '../../packages/agent/src'),
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
      // used for bottom sheet
      'react-native-reanimated/plugin',
    ],
  }
}
