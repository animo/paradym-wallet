import { Heading, Paragraph, XStack, YStack } from '@internal/ui'

interface CredentialRowCardProps {
  name: string
  issuer: string
  onPress?(): void
  bgColor?: string
}

export default function CredentialRowCard({
  name,
  issuer,
  bgColor,
  onPress,
}: CredentialRowCardProps) {
  return (
    <XStack
      onPress={onPress}
      py="$2"
      g="lg"
      pressStyle={{ backgroundColor: onPress && '$grey-100' }}
    >
      <XStack bg={bgColor ?? '$feature-500'} h="100%" w="25%" br="$2" border />
      <YStack>
        <Heading variant="h3" numberOfLines={1}>
          {name}
        </Heading>
        <Paragraph variant="sub" secondary>
          {issuer}
        </Paragraph>
      </YStack>
    </XStack>
  )
}
