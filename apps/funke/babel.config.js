module.exports = (api) => {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        },
      ],
      [
        '@tamagui/babel-plugin',
        {
          components: ['@package/ui', 'tamagui'],
          config: './tamagui.config.ts',
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      // used for bottom sheet
      'react-native-reanimated/plugin',
    ],
  }
}
