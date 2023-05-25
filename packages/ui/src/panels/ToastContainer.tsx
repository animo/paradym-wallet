import { Paragraph, YStack } from '../base'

interface ToastContainerProps {
  title: string
  safeAreaMargin?: boolean
}

export const ToastContainer = ({ title, safeAreaMargin = false }: ToastContainerProps) => {
  return (
    <YStack
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="quick"
      backgroundColor="$white"
      margin={safeAreaMargin ? '$4' : 0}
      padding="$3"
      borderRadius="$4"
    >
      <Paragraph>{title}</Paragraph>
    </YStack>
  )
}
