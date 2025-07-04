import { ToastContainer, YStack } from '@package/ui'
import { Toast, useToastState } from '@tamagui/toast'
import { useEffect, useRef } from 'react'
import { AccessibilityInfo, findNodeHandle } from 'react-native'

export const CustomToast = () => {
  const currentToast = useToastState()
  const viewRef = useRef(null)

  useEffect(() => {
    if (currentToast) {
      // Add a small delay to ensure the view is mounted
      setTimeout(() => {
        const handle = findNodeHandle(viewRef.current)
        if (handle) {
          AccessibilityInfo.announceForAccessibility(currentToast.title)
        }
      }, 100)
    }
  }, [currentToast])

  if (!currentToast || currentToast.isHandledNatively) {
    return null
  }

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      viewportName={currentToast.viewportName}
      p="$4"
      width="100%"
    >
      <YStack ref={viewRef} accessible={true} role="alert" aria-label={currentToast.title}>
        <ToastContainer
          title={currentToast.title}
          message={currentToast.message}
          variant={currentToast.customData?.preset}
        />
      </YStack>
    </Toast>
  )
}
