import { radius, size, space, zIndex } from '@tamagui/themes'

import { configInput, fontOpenSans, fontRaleway, hexColors } from '@package/ui/src/config/tamagui.config'
import { createMedia, createTamagui, createTokens } from 'tamagui'

export const tokensInput = {
  color: hexColors,
  radius: {
    ...radius,
    button: 16,
  },
  size,
  zIndex,
  space,
} as const

const tokens = createTokens({
  ...tokensInput,
  size: {
    ...tokensInput.size,
    buttonHeight: 56,
  },
  color: {
    ...hexColors, // Re-use existing colors for positive/warnings etc.
    background: hexColors.white,
    'grey-50': '#F5F7F8',
    'grey-100': '#EBF1F3',
    'grey-200': '#E5E9EC',
    'grey-300': '#D7DCE0',
    'grey-400': '#BFC5CB',
    'grey-500': '#839196',
    'grey-600': '#6D7581',
    'grey-700': '#656974',
    'grey-800': '#464B56',
    'grey-900': '#222222',
    'primary-50': '#F7F7FF',
    'primary-100': '#EEF0FE',
    'primary-200': '#DADEFF',
    'primary-300': '#ACB4FB',
    'primary-400': '#7A88FF',
    'primary-500': '#5A33F6',
    'primary-600': '#2233C9',
    'primary-700': '#202EA7',
    'primary-800': '#141E80',
    'primary-900': '#131C66',
    'feature-300': '#DFA6FF',
    'feature-400': '#CA79FF',
    'feature-500': '#A000F8',
    'feature-600': '#8600D1',
    'feature-700': '#7E00CC',
  },
})

const config = createTamagui({
  ...configInput,
  tokens,
  fonts: {
    default: fontOpenSans,
    heading: fontRaleway,
    // Somehow adding body font gives build errors?!
    body: fontOpenSans,
  },
  themes: {
    light: {
      ...tokens.color,
      tableBackgroundColor: tokens.color['grey-50'],
      tableBorderColor: '#ffffff',
      idCardBackground: '#F1F2F0',
    },
  },
  media: createMedia({
    short: {
      maxHeight: 756,
    },
  }),
})

type ConfIg = typeof config
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends ConfIg {}
}

export default config
