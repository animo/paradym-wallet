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
    buttonHeight: 53,
  },
  color: {
    ...hexColors, // Re-use existing colors for positive/warnings etc.
    background: hexColors.white,
    'grey-100': '#EFF3F6',
    'grey-200': '#E3E8EC',
    'grey-300': '#D7DCE0',
    'grey-400': '#BFC5CB',
    'grey-500': '#ACB3BB',
    'grey-600': '#8A929B',
    'grey-700': '#656974',
    'grey-800': '#464B56',
    'grey-900': '#282C37',
    'primary-100': '#dbe9fe ',
    'primary-200': '#bfd9fe',
    'primary-300': '#93c2fd',
    'primary-400': '#5fa1fb',
    'primary-500': '#2c73f6',
    'primary-600': '#245dec',
    'primary-700': '#1c49d9',
    'primary-800': '#1e3caf',
    'primary-900': '#1e378a',
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
    light: tokens.color,
  },
})

type ConfIg = typeof config
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends ConfIg {}
}

export default config
