import { AnimatedStack, Heading, Image, Paragraph, Stack, useScaleAnimation, XStack, YStack } from '@package/ui'

interface InboxNotificationRowCardProps {
  title: string
  description: string
  backgroundColor?: string
  backgroundImageUrl?: string
  onPress?(): void
}

export function InboxNotificationRowCard({
  title,
  description,
  onPress,
  backgroundColor,
  backgroundImageUrl,
}: InboxNotificationRowCardProps) {
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
      <Stack border bg={backgroundColor ?? '$grey-900'} h="$4.5" w="24%" br="$2" overflow="hidden" pos="relative">
        {backgroundImageUrl && (
          <Stack pos="absolute" top={0} left={0} right={0} bottom={0}>
            <Image src={backgroundImageUrl} alt="Card" contentFit="cover" height="100%" width="100%" />
          </Stack>
        )}
      </Stack>
      <YStack gap="$0.5" jc="space-between" fg={1} w="75%">
        <XStack jc="space-between">
          <Paragraph numberOfLines={1}>{description}</Paragraph>
        </XStack>
        <Heading heading="h3" numberOfLines={1} fontWeight="$semiBold" color="$grey-900">
          {title}
        </Heading>
      </YStack>
    </AnimatedStack>
  )
}
