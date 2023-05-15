import { createInterFont } from '@tamagui/font-inter'
import { shorthands } from '@tamagui/shorthands'
import { radius, space, zIndex, size } from '@tamagui/themes'
import { createTamagui, createTokens } from 'tamagui'

import { animations } from './animations'

// FIXME: i don't think this is enforced.
const headingFont = createInterFont({
  size: {
    1: 18, // Heading 3
    2: 20, // Heading 2
    3: 24, // Heading 1
    4: 38, // Page Title
  },
  weight: {
    5: '500', // medium
    6: '600', // semibold
  },
  letterSpacing: {
    5: 2,
    6: 1,
    7: 0,
    8: -1,
    9: -2,
    10: -3,
    12: -4,
    14: -5,
    15: -6,
  },
})

const bodyFont = createInterFont({
  size: {
    1: 12, // Annotation
    2: 14, // Sub text
    3: 16, // Body text
  },
})

export const absoluteFill = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
}

export const paddingSizes = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
}

export const borderRadiusSizes = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 24,
}

export const paddingVariants = {
  pad: {
    xs: {
      padding: paddingSizes.xs,
    },
    sm: {
      padding: paddingSizes.sm,
    },
    md: {
      padding: paddingSizes.md,
    },
    lg: {
      padding: paddingSizes.lg,
    },
    xl: {
      padding: paddingSizes.xl,
    },
  } as const,
}

export const tokens = createTokens({
  color: {
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
    translucent: 'rgba(0,0,0,0.4)',
  },
  size,
  radius,
  zIndex,
  space,
})

export const config = createTamagui({
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
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
})
