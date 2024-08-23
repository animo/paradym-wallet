import type { PropsWithChildren } from 'react'
import { ToastViewport } from './ToastViewport'
import { Platform } from 'react-native'

export function ModalProvider({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      {/* On iOS the separate modal is really a separate view, but not on android */}
      {Platform.OS === 'ios' && <ToastViewport safeArea={false} />}
    </>
  )
}
