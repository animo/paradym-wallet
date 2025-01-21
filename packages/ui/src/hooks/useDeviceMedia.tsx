import { useMedia } from '@tamagui/web'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useDeviceMedia = () => {
  const media = useMedia()
  const additionalPadding = media.short ? 16 : 24
  const { bottom } = useSafeAreaInsets()
  const noBottomSafeArea = bottom === 0

  return { media, additionalPadding, noBottomSafeArea }
}
