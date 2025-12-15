import type { ReactElement } from 'react'
import { Heading, Paragraph, Stack, XStack, YStack } from '../base'

interface OnboardingStepItemProps {
  stepName: string
  description: string
  title: string
  icon: ReactElement
}

export const OnboardingStepItem = ({ stepName, title, description, icon }: OnboardingStepItemProps) => {
  return (
    <XStack gap="$3">
      <Stack
        backgroundColor="$primary-500"
        width="$4"
        height="$4"
        borderRadius="$12"
        justifyContent="center"
        alignItems="center"
      >
        {icon}
      </Stack>
      <YStack gap="$1" flex-1>
        <Paragraph variant="caption" textTransform="uppercase">
          {stepName}
        </Paragraph>
        <Heading heading="sub1">{title}</Heading>
        <Paragraph>{description}</Paragraph>
      </YStack>
    </XStack>
  )
}
