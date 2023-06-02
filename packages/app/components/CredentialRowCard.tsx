import { Heading, Paragraph, XStack, YStack, borderRadiusSizes, paddingSizes } from '@internal/ui'

interface CredentialRowCardProps {
  name: string
  issuer: string
  onPress(): void
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
      pad="md"
      py={paddingSizes.sm}
      g="lg"
      pressStyle={{ backgroundColor: '$grey-100' }}
    >
      <XStack bg={bgColor ?? '$feature-500'} h="100%" w="25%" br={borderRadiusSizes.md} border />
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
