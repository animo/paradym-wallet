import type { StorybookConfig } from '@storybook/react-webpack5'
import { type PluginOptions, TamaguiPlugin } from 'tamagui-loader'

const tamaguiOptions: PluginOptions = {
  components: ['@package/ui', 'tamagui'],
  config: './tamagui.config.ts',
  disableExtraction: true,
}

module.exports = {
  stories: ['../components/**/*.stories.mdx', '../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-react-native-web'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: (config) => {
    const plugins = config.plugins ?? []
    plugins.push(new TamaguiPlugin(tamaguiOptions))

    return {
      ...config,
      plugins,
    }
  },
  docs: {
    autodocs: true,
  },
} satisfies StorybookConfig
