import { useWindowDimensions } from 'react-native'

/** From this text size on, a step's actions follow its content instead of sitting in a sticky footer. */
const accessibilityFontScale = 1.5

export function useIsAccessibilityTextSize() {
  return useWindowDimensions().fontScale >= accessibilityFontScale
}
