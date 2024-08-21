import type { ComponentProps } from 'react'
import { Stack, XStack, YStack } from '../base'
import { HeroIcons, ProgressBar } from '../content'

interface OnboardingScreensHeaderProps extends ComponentProps<typeof YStack> {
  progress: number
  onBack?: () => void
}

export function OnboardingScreensHeader({ progress, onBack }: OnboardingScreensHeaderProps) {
  return (
    <YStack gap="$3">
      <XStack jc="space-between">
        <Stack p="$2" onPress={onBack}>
          <HeroIcons.ArrowLeft color="$grey-900" />
        </Stack>
        {/* <Stack p="$2">
          <HeroIcons.QuestionMarkCircle color="$grey-900" />
        </Stack> */}
      </XStack>
      <ProgressBar mb="$4" value={progress} />
    </YStack>
  )
}
