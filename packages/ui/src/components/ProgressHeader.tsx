import type { ComponentProps } from 'react'
import { Stack, XStack, YStack } from '../base'
import { HeroIcons, ProgressBar } from '../content'

interface ProgressHeaderProps extends ComponentProps<typeof YStack> {
  progress: number
  onBack?: () => void
  onCancel?: () => void
}

export function ProgressHeader({ progress, onBack, onCancel, ...props }: ProgressHeaderProps) {
  return (
    <YStack gap="$3" {...props}>
      <XStack jc="space-between">
        <Stack p="$2" onPress={onBack}>
          {onBack && <HeroIcons.ArrowLeft color="$grey-900" />}
        </Stack>
        <Stack p="$2" onPress={onCancel}>
          {onCancel && <HeroIcons.X color="$grey-900" />}
        </Stack>
      </XStack>
      <ProgressBar mb="$4" value={progress} />
    </YStack>
  )
}
