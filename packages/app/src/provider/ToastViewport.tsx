import { Toast } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CustomToast } from '../components'

interface ToastViewportProps {
  safeArea?: boolean
}

export const ToastViewport = ({ safeArea = true }: ToastViewportProps) => {
  const { top, right, left } = useSafeAreaInsets()

  return (
    <Toast.Viewport
      portalToRoot={false}
      offset={0}
      // The toasts are absolutely positioned and Android doesn't deliver touches or accessibility outside a parent's
      // bounds, so the viewport covers the screen. It passes touches through everywhere but the toasts.
      bottom={0}
      {...(safeArea ? { top: top + 5, left, right } : { top: 0, left: 0, right: 0 })}
    >
      <Toast.List renderItem={(props) => <CustomToast {...props} />} />
    </Toast.Viewport>
  )
}
