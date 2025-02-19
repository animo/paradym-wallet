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
