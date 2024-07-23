import { useToastController } from '@tamagui/toast'

import { Paragraph, Stack, XStack } from '../base'
import { LucideIcons } from '../content'

interface ToastContainerProps {
  title: string
  safeAreaMargin?: boolean
}

export const ToastContainer = ({ title, safeAreaMargin = false }: ToastContainerProps) => {
  const toast = useToastController()
  return (
    <XStack
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
      jc="space-between"
      ai="center"
    >
      <Paragraph w="90%">{title}</Paragraph>
      <Stack jc="center" h="100%" onPress={() => toast.hide()}>
        <LucideIcons.X size="$1" color="$grey-600" />
      </Stack>
    </XStack>
  )
}
