import { Heading, Paragraph, XStack, YStack } from '@internal/ui'

interface InboxNotificationRowCardProps {
  title: string
  description: string
  onPress?(): void
}

export default function InboxNotificationRowCard({
  title,
  description,
  onPress,
}: InboxNotificationRowCardProps) {
  return (
    <YStack bg="$white" br="$4">
      <XStack
        onPress={onPress}
        pad="lg"
        g="md"
        pressStyle={{ backgroundColor: onPress && '$grey-100' }}
        overflow="hidden"
      >
        <XStack bg="$grey-700" h="$5" w="$5" br="$2" />
        <YStack jc="space-between">
          <Paragraph variant="sub" numberOfLines={1} opacity={0.8}>
            {description}
          </Paragraph>
          <Heading variant="h3" numberOfLines={1} size="$4">
            {title}
          </Heading>
        </YStack>
      </XStack>
    </YStack>
  )
}
