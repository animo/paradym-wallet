import { AnimatedStack, Heading, Paragraph, XStack, YStack, useScaleAnimation } from '@package/ui'

interface InboxNotificationRowCardProps {
  title: string
  description: string
  bgColor?: string
  onPress?(): void
}

export function InboxNotificationRowCard({ title, description, onPress, bgColor }: InboxNotificationRowCardProps) {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <AnimatedStack
      flexDirection="row"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      gap="$3"
      ai="center"
      style={pressStyle}
      onPress={onPress}
    >
      <XStack border bg={bgColor ?? '$grey-900'} h="$4.5" w="24%" br="$2" />
      <YStack gap="$0.5" jc="space-between" fg={1} w="75%">
        <XStack jc="space-between">
          <Paragraph numberOfLines={1}>{description}</Paragraph>
        </XStack>
        <Heading variant="h3" numberOfLines={1} fontWeight="$semiBold" color="$grey-900">
          {title}
        </Heading>
      </YStack>
    </AnimatedStack>
  )
}
