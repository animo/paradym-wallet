import { Heading, Paragraph, XStack, YStack } from '@package/ui'

interface InboxNotificationRowCardProps {
  title: string
  description: string
  bgColor?: string
  onPress?(): void
}

export function InboxNotificationRowCard({ title, description, onPress, bgColor }: InboxNotificationRowCardProps) {
  return (
    <YStack bg="$white" br="$4">
      <XStack
        onPress={onPress}
        pad="lg"
        g="md"
        pressStyle={{ backgroundColor: onPress && '$grey-100' }}
        overflow="hidden"
      >
        <XStack border bg={bgColor ?? '$grey-700'} h="$4.5" w="24%" br="$2" />
        <YStack flex={1} jc="space-between">
          <Paragraph color="$grey-600" variant="sub" numberOfLines={1}>
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
