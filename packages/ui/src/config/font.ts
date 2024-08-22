import { createInterFont } from '@tamagui/font-inter'
import { Platform } from 'react-native'
import { createFont } from 'tamagui'

export const fontOpenSans = createFont({
  family: 'Open Sans',
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
    7: 28, // Page Title
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    // Android uses filename, iOS uses PostScript name (configured in app.config.js with expo-font plugin)
    '400': { normal: Platform.select({ ios: 'OpenSans-Regular', android: 'OpenSans_400Regular' }) },
    '500': { normal: Platform.select({ ios: 'OpenSans-Medium', android: 'OpenSans_500Medium' }) },
    '600': { normal: Platform.select({ ios: 'OpenSans-SemiBold', android: 'OpenSans_600SemiBold' }) },
    '700': { normal: Platform.select({ ios: 'OpenSans-Bold', android: 'OpenSans_700Bold' }) },
  },
})

export const fontRaleway = createFont({
  family: 'Raleway',
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
    7: 28, // Page Title
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    // Raleway is a lighter font in terms of weight, so we move all the weights one step up.
    // Android uses filename, iOS uses PostScript name (configured in app.config.js with expo-font plugin)
    '400': { normal: Platform.select({ ios: 'Raleway-Regular', android: 'Raleway_400Regular' }) },
    '500': { normal: Platform.select({ ios: 'Raleway-Medium', android: 'Raleway_500Medium' }) },
    '600': { normal: Platform.select({ ios: 'Raleway-SemiBold', android: 'Raleway_600SemiBold' }) },
    '700': { normal: Platform.select({ ios: 'Raleway-Bold', android: 'Raleway_700Bold' }) },
  },
})

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
    7: 28, // Page Title
  },
  letterSpacing: {
    4: 0,
  },
  face: {
    '400': { normal: 'Inter-Regular' },
    '500': { normal: 'Inter-Medium' },
    '600': { normal: 'Inter-SemiBold' },
    '700': { normal: 'Inter-Bold' },
  },
})
