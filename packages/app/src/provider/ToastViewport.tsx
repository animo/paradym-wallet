import { ToastViewport as TV } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ToastViewportProps {
  safeArea?: boolean
}

export const ToastViewport = ({ safeArea = true }: ToastViewportProps) => {
  const { top, right, left } = useSafeAreaInsets()

  return safeArea ? <TV top={top + 5} left={left} right={right} /> : <TV />
}
