import { Toast, useToastState } from '@tamagui/toast'

import { ToastContainer } from './ToastContainer'

export const CustomToast = () => {
  const currentToast = useToastState()

  if (!currentToast || currentToast.isHandledNatively) {
    return null
  }

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      viewportName={currentToast.viewportName}
      p={0}
      width="100%"
    >
      <ToastContainer title={currentToast.title} />
    </Toast>
  )
}
