import { Toast, ToastContainer, type ToastItemRenderProps, type ToastPreset, YStack } from '@package/ui'
import { useEffect } from 'react'
import { AccessibilityInfo } from 'react-native'

export const CustomToast = ({ toast, index, handleClose }: ToastItemRenderProps) => {
  const title = String(typeof toast.title === 'function' ? toast.title() : toast.title)
  const message = typeof toast.description === 'string' ? toast.description : undefined

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(title)
  }, [title])

  return (
    <Toast.Item
      toast={toast}
      index={index}
      p="4"
      my="1"
      width="100%"
      // The shadow v2's toast frame had (`elevation="$3"`)
      shadowColor="black"
      shadowRadius={20}
      shadowOffset={{ width: 0, height: 10 }}
    >
      <YStack accessible={true} role="alert" aria-label={title}>
        <ToastContainer
          title={title}
          message={message}
          variant={toast.data?.preset as ToastPreset | undefined}
          onClose={handleClose}
        />
      </YStack>
    </Toast.Item>
  )
}
