export const APP_THEME = {
  FUNKE_WALLET: {
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
  PARADYM_WALLET: {
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
} satisfies Record<string, Theme>

export interface Theme {
  'primary-50': string
  'primary-100': string
  'primary-200': string
  'primary-300': string
  'primary-400': string
  'primary-500': string
  'primary-600': string
  'primary-700': string
  'primary-800': string
  'primary-900': string
  'feature-300': string
  'feature-400': string
  'feature-500': string
  'feature-600': string
  'feature-700': string
}

export type ThemeKey = keyof Theme
