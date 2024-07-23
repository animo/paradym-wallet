import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds'
import type { Preview } from '@storybook/react'
import withThemeProvider from '../.storybook/withThemeProvider'

const preview: Preview = {
  decorators: [withBackgrounds, withThemeProvider],

  parameters: {
    backgrounds: {
      default: 'grey',
      values: [
        {
          name: 'grey',
          value: '#F2F4F6',
        },
        {
          name: 'light',
          value: '#F8F8F8',
        },
        {
          name: 'dark',
          value: '#333333',
        },
      ],
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
}

export default preview
