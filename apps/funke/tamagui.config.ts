// don't import from here, that's handled already
// instead this is just setting types for this folder
import { configInput, hexColors, tokensInput } from '@package/ui/src/config/tamagui.config'
import { createTamagui, createTokens } from 'tamagui'

const tokens = createTokens({
  ...tokensInput,
  color: {
    ...hexColors,

    // TODO: primary color shades
    'primary-100': '#3B82F6',
    'primary-200': '#3B82F6',
    'primary-300': '#3B82F6',
    'primary-400': '#3B82F6',
    'primary-500': '#3B82F6',
    'primary-600': '#3B82F6',
    'primary-700': '#3B82F6',
    'primary-800': '#3B82F6',
    'primary-900': '#3B82F6',
  },
})

const config = createTamagui({
  ...configInput,
  tokens,
  fonts: {
    ...configInput.fonts,
    // We use different font in the funke app
    default: configInput.fonts.raleway,
  },
  themes: {
    dark: {
      ...tokens.color,
    },
    light: {
      ...tokens.color,
    },
  },
})

type ConfIg = typeof config
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends ConfIg {}
}

export default config
