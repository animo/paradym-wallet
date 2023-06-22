import { Heading, Paragraph, XStack, YStack } from '@internal/ui'

interface CredentialRowCardProps {
  name: string
  issuer?: string
  onPress?(): void
  bgColor?: string
  hideBorder?: boolean
}

export default function CredentialRowCard({
  name,
  issuer,
  bgColor,
  onPress,
  hideBorder = false,
}: CredentialRowCardProps) {
  return (
    <YStack>
      <XStack
        onPress={onPress}
        pad="md"
        g="md"
        px="$4"
        pressStyle={{ backgroundColor: onPress && '$grey-200' }}
        overflow="hidden"
      >
        <XStack bg={bgColor ?? '$grey-700'} h="$5" w="24%" br="$2" />
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
      {!hideBorder && (
        <XStack
          position="absolute"
          right={0}
          bottom={1}
          w="72%"
          borderBottomWidth={1}
          borderBottomColor="$grey-200"
        />
      )}
    </YStack>
  )
}
