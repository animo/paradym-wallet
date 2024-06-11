import { ToastViewport as TV } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const ToastViewport = () => {
  const { top, right, left } = useSafeAreaInsets()
  return <TV top={top + 5} left={left} right={right} />
}
