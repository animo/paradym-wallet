import { Toast, useToastController } from '@tamagui/toast'

import { type EntryExitAnimationFunction, withSpring, withTiming } from 'react-native-reanimated'
import { AnimatedStack, Stack, XStack, YStack } from '../base'
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
  danger: <HeroIcons.ExclamationCircleFilled size={20} color="$color.danger-500" />,
  success: <HeroIcons.CheckCircleFilled size={20} color="$color.positive-500" />,
  none: <HeroIcons.InformationCircleFilled size={20} color="$color.primary-500" />,
}

const enteringAnimation: EntryExitAnimationFunction = () => {
  'worklet'
  const animations = {
    originY: withSpring(0, { damping: 16, mass: 1, stiffness: 140, restSpeedThreshold: 0.1 }),
    opacity: withTiming(1, { duration: 200 }),
  }
  const initialValues = {
    originY: -20,
    opacity: 0,
  }
  return {
    initialValues,
    animations,
  }
}

const exitingAnimation: EntryExitAnimationFunction = () => {
  'worklet'
  const animations = {
    originY: withTiming(-20, { duration: 200 }),
    opacity: withTiming(0, { duration: 200 }),
  }
  const initialValues = {
    originY: 0,
    opacity: 1,
  }
  return {
    initialValues,
    animations,
  }
}

export const ToastContainer = ({ title, message, variant = 'none' }: ToastContainerProps) => {
  const toast = useToastController()

  const icon = iconMapping[variant]
  return (
    <AnimatedStack
      entering={enteringAnimation}
      exiting={exitingAnimation}
      flexDirection="row"
      backgroundColor="$grey-900"
      shadow="sm"
      borderRadius="$5"
      padding="$3"
      f={1}
      bw={1}
      fg={1}
      w="100%"
      gap="$2"
      jc="space-between"
    >
      <XStack gap="$3" f={1}>
        <Stack>{icon}</Stack>
        <YStack gap="$1" f={1}>
          <Toast.Title color="$white" size="$3">
            {title}
          </Toast.Title>
          {message && (
            <Toast.Description color="$grey-400" size="$2">
              {message}
            </Toast.Description>
          )}
        </YStack>
      </XStack>
      <Toast.Close m="$-1" onPress={() => toast.hide()}>
        <LucideIcons.X size="$1" color="$grey-400" />
      </Toast.Close>
    </AnimatedStack>
  )
}
