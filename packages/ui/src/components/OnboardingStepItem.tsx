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
        width="$4"
        height="$4"
        borderRadius="$12"
        justifyContent="center"
        alignItems="center"
      >
        {icon}
      </Stack>
      <YStack gap="$2" flex-1>
        <Paragraph variant="sub" color="$grey-700" fontWeight="$semiBold" textTransform="uppercase">
          {stepName}
        </Paragraph>
        <Heading variant="h3" fontWeight="$semiBold" color="$grey-800">
          {title}
        </Heading>
        <Paragraph variant="text" size="$3" color="$grey-700" fontWeight="$regular">
          {description}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
