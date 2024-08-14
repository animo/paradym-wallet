import { Heading, Paragraph, Stack, XStack, YStack } from '../base'

interface OnboardingStepItemProps {
  stepName: string
  description: string
  title: string
  icon: JSX.Element
}

export const OnboardingStepItem = ({ stepName, title, description, icon }: OnboardingStepItemProps) => {
  return (
    <XStack gap="$3">
      <Stack
        backgroundColor="$primary-500"
        width={36}
        height={36}
        borderRadius={500}
        justifyContent="center"
        alignItems="center"
      >
        {icon}
      </Stack>
      <YStack gap="$2" flex-1>
        <Paragraph variant="sub" textTransform="uppercase">
          {stepName}
        </Paragraph>
        <Heading variant="h2">{title}</Heading>
        <Paragraph variant="text" size="$3" fontWeight="$regular">
          {description}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
