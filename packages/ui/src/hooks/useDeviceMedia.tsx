import { useMedia } from '@tamagui/web'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SHORT_DEVICE_PADDING = 16
const LONG_DEVICE_PADDING = 24

export const useDeviceMedia = () => {
  const media = useMedia()
  const additionalPadding = media.short ? SHORT_DEVICE_PADDING : LONG_DEVICE_PADDING
  const { bottom } = useSafeAreaInsets()
  const noBottomSafeArea = bottom === 0

  return { media, additionalPadding, noBottomSafeArea }
}
