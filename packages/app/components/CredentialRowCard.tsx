import { Heading, Paragraph, XStack, YStack } from '@internal/ui'

interface CredentialRowCardProps {
  name: string
  issuer?: string
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
    <YStack>
      <XStack
        onPress={onPress}
        pad="md"
        g="md"
        pressStyle={{ backgroundColor: onPress && '$grey-100' }}
        overflow="hidden"
      >
        <XStack bg={bgColor ?? '$grey-700'} h="$4.5" w="24%" br="$2" />
        <YStack jc={issuer ? 'space-between' : 'center'}>
          <Heading variant="h3" numberOfLines={1}>
            {name}
          </Heading>
          {issuer && (
            <Paragraph variant="sub" secondary>
              {issuer}
            </Paragraph>
          )}
        </YStack>
      </XStack>
      <XStack
        position="absolute"
        right={0}
        w="70%"
        borderBottomWidth={1}
        borderBottomColor="$grey-200"
      />
    </YStack>
  )
}
