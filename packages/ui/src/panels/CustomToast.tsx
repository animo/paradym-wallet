import { Toast, useToastState } from '@tamagui/toast'

import { YStack, Paragraph } from '../base'

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
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="quick"
      backgroundColor="$white"
      margin="$4"
      padding="$3"
      borderRadius="$4"
    >
      <YStack p={0}>
        {!!currentToast.title && <Toast.Title>{currentToast.title}</Toast.Title>}
      </YStack>
    </Toast>
  )
}

export const MockToast = ({ message }: { message: string }) => {
  return (
    <YStack
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="quick"
      backgroundColor="$white"
      margin="$4"
      padding="$3"
      borderRadius="$4"
    >
      <Paragraph>{message}</Paragraph>
    </YStack>
  )
}
