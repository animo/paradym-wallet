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
      g="md"
      pressStyle={{ backgroundColor: onPress && '$grey-100' }}
      overflow="hidden"
    >
      <XStack bg={bgColor ?? '$primary-500'} h="100%" w="24%" br="$2" border />
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
