import { Heading, Paragraph, ProgressBar, YStack } from '@package/ui'
import type { ComponentProps } from 'react'

interface OnboardingScreensHeaderProps extends ComponentProps<typeof YStack> {
  progress: number
  title: string
  subtitle?: string
}

export function OnboardingScreensHeader({ progress, title, subtitle, ...props }: OnboardingScreensHeaderProps) {
  return (
    <YStack gap="$2" {...props}>
      <ProgressBar mb="$4" value={progress} />
      <Heading variant="title">{title}</Heading>
      {subtitle && <Paragraph>{subtitle}</Paragraph>}
    </YStack>
  )
}
