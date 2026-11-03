import { Toast, toast } from '@tamagui/toast'
import { useMemo } from 'react'
import { Stack, XStack, YStack } from '../base'
import { HeroIcons, LucideIcons } from '../content'

export type ToastPreset = 'danger' | 'success' | 'warning' | 'none'

interface ToastShowOptions {
  message?: string
  customData?: {
    /**
     * @default "none"
     */
    preset?: ToastPreset
  }
}

/**
 * Shows toasts through v3's `toast()`, keeping the `show(title, { message, customData })` shape of v2's controller.
 */
export function useToastController() {
  return useMemo(
    () => ({
      show: (title: string, options?: ToastShowOptions) =>
        toast(title, { description: options?.message, data: { preset: options?.customData?.preset } }),
      hide: () => toast.dismiss(),
    }),
    []
  )
}

interface ToastContainerProps {
  title: string
  message?: string
  variant?: ToastPreset
  onClose: () => void
}

const iconMapping = {
  danger: <HeroIcons.ExclamationCircleFilled size={20} color="danger-500" />,
  success: <HeroIcons.CheckCircleFilled size={20} color="positive-500" />,
  warning: <HeroIcons.ExclamationCircleFilled size={20} color="warning-500" />,
  none: <HeroIcons.InformationCircleFilled size={20} color="grey-50" />,
}

export const ToastContainer = ({ title, message, variant = 'none', onClose }: ToastContainerProps) => {
  const icon = iconMapping[variant]
  return (
    <Stack
      flexDirection="row"
      backgroundColor="grey-900"
      shadow="sm"
      borderRadius="5"
      padding="3"
      flex={1}
      borderWidth={1}
      grow={1}
      w="100%"
      gap="2"
      justify="space-between"
    >
      <XStack gap="3" flex={1}>
        <Stack>{icon}</Stack>
        <YStack gap="0-5" flex={1}>
          <Toast.Title color="white" size="3">
            {title}
          </Toast.Title>
          {message && (
            <Toast.Description color="grey-400" size="2">
              {message}
            </Toast.Description>
          )}
        </YStack>
      </XStack>
      {/* somehow onPress does not trigger on Android */}
      <Toast.Close
        role="button"
        aria-label="Close"
        m="-0-5"
        width="auto"
        height="auto"
        alignItems="flex-start"
        onPressOut={onClose}
      >
        <LucideIcons.X size={20} color="grey-400" />
      </Toast.Close>
    </Stack>
  )
}
