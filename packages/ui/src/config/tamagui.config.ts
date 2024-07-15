import { shorthands } from '@tamagui/shorthands'
import { radius, size, space, zIndex } from '@tamagui/themes'
import { type CreateTamaguiProps, createTamagui, createTokens } from 'tamagui'

import { animations } from '../animations'

import { fontInter, fontRaleway } from './font'
export { fontInter, fontRaleway }

export const absoluteFill = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
}

export const hexColors = {
  'grey-100': '#F8F8FA',
  'grey-200': '#F2F4F6',
  'grey-300': '#E0E3E8',
  'grey-400': '#C6CED5',
  'grey-500': '#9CA5AF',
  'grey-600': '#6D7581',
  'grey-700': '#2F3338',
  'grey-800': '#1E1E1E',
  'grey-900': '#111111',
  'primary-100': '#EEF0FE',
  'primary-200': '#DADEFF',
  'primary-300': '#ACB4FB',
  'primary-400': '#7A88FF',
  'primary-500': '#5A33F6',
  'primary-600': '#2233C9',
  'primary-700': '#202EA7',
  'primary-800': '#141E80',
  'primary-900': '#131C66',
  'feature-300': '#DBEAFE',
  'feature-400': '#60A5FA',
  'feature-500': '#3B82F6',
  'feature-600': '#1D4ED8',
  'feature-700': '#1E40AF',
  'positive-300': '#E8FFF1',
  'positive-400': '#7EE3A6',
  'positive-500': '#31C66C',
  'positive-600': '#34AA63',
  'positive-700': '#1B7641',
  'warning-300': '#FEF3C7',
  'warning-400': '#FCD34D',
  'warning-500': '#FBBF24',
  'warning-600': '#D97706',
  'warning-700': '#92400E',
  'danger-300': '#FEE2E2',
  'danger-400': '#F87171',
  'danger-500': '#DC3130',
  'danger-600': '#B8201F',
  'danger-700': '#991B1B',
  white: '#FFF',
  black: '#000',
  darkTranslucent: 'rgba(0,0,0,0.4)',
  lightTranslucent: 'rgba(255, 255, 255,  0.2)',
  borderTranslucent: 'rgba(224, 227, 232, 0.5)', // grey-300 with opacity
}

export const tokensInput = {
  color: {
    ...hexColors,
    background: hexColors['grey-200'],
  },
  size,
  radius,
  zIndex,
  space,
} as const
export const tokens = createTokens(tokensInput)

export const configInput = {
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    default: fontInter,
  },
  tokens,
  themes: {
    dark: {
      ...tokens.color, // use same scheme in dark mode for now
    },
    light: {
      ...tokens.color,
    },
  },
} as const satisfies CreateTamaguiProps

export const config = createTamagui(configInput)
