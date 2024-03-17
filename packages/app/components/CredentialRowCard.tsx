import { Heading, Paragraph, XStack, YStack } from '@internal/ui'

interface CredentialRowCardProps {
  name: string
  issuer?: string
  onPress?(): void
  bgColor?: string
  hideBorder?: boolean
  showFullText?: boolean
}

export default function CredentialRowCard({
  name,
  issuer,
  bgColor,
  onPress,
  hideBorder = false,
  showFullText = false,
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
        <XStack border bg={bgColor ?? '$grey-700'} h="$4.5" w="24%" br="$2" />
        <YStack flex={1} jc={issuer ? 'space-between' : 'center'}>
          <Heading variant="h3" numberOfLines={showFullText ? 2 : 1}>
            {name}
          </Heading>
          {issuer && (
            <Paragraph variant="sub" secondary numberOfLines={showFullText ? 3 : 1}>
              {issuer}
            </Paragraph>
          )}
        </YStack>
      </XStack>
      {!hideBorder && (
        <XStack
          position="absolute"
          right={0}
          bottom={1}
          w="70%"
          borderBottomWidth={1}
          borderBottomColor="$grey-200"
        />
      )}
    </YStack>
  )
}
