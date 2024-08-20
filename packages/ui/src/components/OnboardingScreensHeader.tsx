import type { ComponentProps } from 'react'
import { Heading, Paragraph, Stack, YStack } from '../base'
import { HeroIcons, ProgressBar } from '../content'

interface OnboardingScreensHeaderProps extends ComponentProps<typeof YStack> {
  progress: number
  title: string
  subtitle?: string
  onBack?: () => void
}

export function OnboardingScreensHeader({ progress, title, subtitle, onBack, ...props }: OnboardingScreensHeaderProps) {
  return (
    <YStack gap="$3">
      <Stack p="$2" onPress={onBack}>
        <HeroIcons.ArrowLeft color="$grey-900" />
      </Stack>
      <ProgressBar mb="$4" value={progress} />
    </YStack>
  )
}
