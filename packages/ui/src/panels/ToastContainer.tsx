import { useToastController } from '@tamagui/toast'

import { YStack } from 'tamagui'
import { Paragraph, Stack, XStack } from '../base'
import { HeroIcons, LucideIcons } from '../content'

declare module '@tamagui/toast' {
  interface CustomData {
    /**
     * @default "none"
     */
    preset?: 'danger' | 'success' | 'none'
  }
}

interface ToastContainerProps {
  title: string
  message?: string
  safeAreaMargin?: boolean
  variant?: 'danger' | 'success' | 'none'
}

const iconMapping = {
  danger: <HeroIcons.ExclamationCircle color="$color.danger-500" />,
  success: <HeroIcons.CheckCircle color="$color.positive-500" />,
  none: undefined,
}

export const ToastContainer = ({ title, message, safeAreaMargin = false, variant = 'none' }: ToastContainerProps) => {
  const toast = useToastController()

  const icon = iconMapping[variant]
  return (
    <XStack
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      animation="quick"
      backgroundColor="$white"
      borderRadius="$4"
      margin={safeAreaMargin ? '$4' : 0}
      padding="$3"
      jc="space-between"
      ai="center"
    >
      {icon && (
        <Stack w="10%" h="100%">
          {icon}
        </Stack>
      )}
      <YStack w={icon ? '80%' : '90%'} gap="$1">
        <Paragraph>{title}</Paragraph>
        {message && <Paragraph variant="sub">{message}</Paragraph>}
      </YStack>
      <Stack w="10%" alignItems="flex-end" onPress={() => toast.hide()}>
        <LucideIcons.X size="$1" color="$grey-600" />
      </Stack>
    </XStack>
  )
}
