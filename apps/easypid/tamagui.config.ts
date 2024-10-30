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
    },
  },
})

type ConfIg = typeof config
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends ConfIg {}
}

export default config
