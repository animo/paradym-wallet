import { createInterFont } from '@tamagui/font-inter'

export const fontInter = createInterFont({
  family: 'Inter',
  weight: {
    regular: '400',
    1: '400',

    medium: '500',
    3: '500',

    semiBold: '600',
    5: '600',

    bold: '700',
    7: '700',
  },
  size: {
    1: 12, // Annotation
    2: 14, // Sub text
    3: 16, // Body text
    true: 16,
    4: 18, // Heading 3
    5: 20, // Heading 2
    6: 24, // Heading 1
    7: 38, // Page Title
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    '400': { normal: 'InterRegular' },
    '500': { normal: 'InterMedium' },
    '600': { normal: 'InterSemiBold' },
    '700': { normal: 'InterBold' },
  },
})
