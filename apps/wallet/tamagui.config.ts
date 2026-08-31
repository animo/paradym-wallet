import { radius, size, space, zIndex } from '@tamagui/themes'
import { createTamagui, createTokens } from 'tamagui'
import { configInput, fontOpenSans, fontRaleway, hexColors } from '../../packages/ui/src/config/tamagui.config'
import { APP_THEME } from './src/config/themes'

const themeColors = APP_THEME

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
    ...themeColors,
  },
})

/**
 * The dark theme, as the same token names the light one uses.
 *
 * The grey ramp is inverted rather than replaced: every component in the kit already reads it by
 * luminance — `$grey-900` is text, `$grey-100` a subtle surface — so reversing the ends keeps those
 * meanings and flips what they resolve to. `$white` goes with it, since it is the page underneath
 * everything; `staticWhite` is what stays white in both themes, for the places where the white is a
 * plate under artwork rather than a surface of ours.
 *
 * The brand and status colours are not inverted: a hue at 500 is the same hue in both themes, only
 * lifted a few steps so it carries against a dark background instead of a light one. Their pale
 * tints (300) become dark tints of the same hue, which is what they are for — a surface to put the
 * colour on.
 */
const darkColors = {
  // No `white`: it is a colour rather than a role, and stays white in both themes. What flips with
  // the theme is `background`, which is the surface every screen and control paints itself with.
  background: '#14171A',

  // Hairlines and scrims, which are the light theme's own colours at low alpha and so do not come
  // along with the ramp: a light hairline over a dark surface reads as a halo rather than an edge.
  borderTranslucent: 'rgba(255, 255, 255, 0.12)',
  lightTranslucent: 'rgba(255, 255, 255, 0.08)',
  darkTranslucent: 'rgba(0, 0, 0, 0.6)',

  'grey-50': '#1A1E22',
  'grey-100': '#21262B',
  'grey-200': '#2A3037',
  'grey-300': '#39414A',
  'grey-400': '#4E5862',
  'grey-500': '#8B979F',
  'grey-600': '#A3ADB6',
  'grey-700': '#C2C9D0',
  'grey-800': '#DDE2E7',
  'grey-900': '#F1F4F6',

  'primary-100': '#1C1B33',
  'primary-200': '#262452',
  'primary-300': '#3A3580',
  'primary-400': '#6A5CE0',
  'primary-500': '#8B7BFF',
  'primary-600': '#A99DFF',
  'primary-700': '#C0B7FF',
  'primary-800': '#D5CFFF',
  'primary-900': '#E8E4FF',

  'danger-300': '#3A1E1E',
  'danger-400': '#B93B3A',
  'danger-500': '#F26B6A',
  'danger-600': '#FF9A99',
  'danger-700': '#FFC4C3',

  'positive-300': '#10301E',
  'positive-400': '#2E8E56',
  'positive-500': '#5FD38C',
  'positive-600': '#8DE3AF',
  'positive-700': '#B9F0CE',

  'warning-300': '#3A2E10',
  'warning-400': '#C99A20',
  'warning-500': '#FBC94D',
  'warning-600': '#FFD98A',
  'warning-700': '#FFE9BE',

  'feature-300': '#2A1140',
  'feature-400': '#8F3FD6',
  'feature-500': '#C06BFF',
  'feature-600': '#D194FF',
  'feature-700': '#E0B8FF',
}

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
    dark: {
      ...tokens.color,
      ...darkColors,
      tableBackgroundColor: darkColors['grey-50'],
      tableBorderColor: darkColors.background,
      idCardBackground: '#23262A',
    },
  },
})

type ConfIg = typeof config
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends ConfIg {}
}

export default config
