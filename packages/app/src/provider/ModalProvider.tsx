import type { PropsWithChildren } from 'react'
import { ToastViewport } from './ToastViewport'

export function ModalProvider({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <ToastViewport safeArea={false} />
    </>
  )
}
