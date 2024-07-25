import type { Preview } from '@storybook/react'
import withThemeProvider from './withThemeProvider'
import 'react-device-frameset/styles/marvel-devices.min.css'
import { withDeviceFrameOnWeb } from './withDeviceFrameOnWeb'

const preview: Preview = {
  decorators: [withThemeProvider, withDeviceFrameOnWeb],
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
