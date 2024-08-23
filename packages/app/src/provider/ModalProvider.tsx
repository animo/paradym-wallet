import type { PropsWithChildren } from 'react'
import { Platform } from 'react-native'
import { ToastViewport } from './ToastViewport'

export function ModalProvider({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      {/* On iOS the separate modal is really a separate view, but not on android */}
      {Platform.OS === 'ios' && <ToastViewport safeArea={false} />}
    </>
  )
}
