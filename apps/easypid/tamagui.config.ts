import { radius, size, space, zIndex } from '@tamagui/themes'

import { configInput, fontOpenSans, fontRaleway, hexColors } from '@package/ui/src/config/tamagui.config'
import { createTamagui, createTokens } from 'tamagui'

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
    'grey-50': '#F6F8F9',
    'grey-100': '#EFF3F6',
    'grey-200': '#E3E8EC',
    'grey-300': '#D7DCE0',
    'grey-400': '#BFC5CB',
    'grey-500': '#839196',
    'grey-600': '#6D7581',
    'grey-700': '#656974',
    'grey-800': '#464B56',
    'grey-900': '#282C37',
    'primary-50': '#F1F4FD',
    'primary-100': '#DFE7FA',
    'primary-200': '#C6D4F7',
    'primary-300': '#9FB9F1',
    'primary-400': '#7294E8',
    'primary-500': '#4365DE',
    'primary-600': '#3C54D4',
    'primary-700': '#3341C2',
    'primary-800': '#2F379E',
    'primary-900': '#2A337E',
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
      tableBackgroundColor: tokens.color['grey-100'],
      tableBorderColor: tokens.color['grey-200'],
    },
  },
})

type ConfIg = typeof config
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends ConfIg {}
}

export default config
