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
      gap="3"
      items="center"
      style={pressStyle}
      onPress={onPress}
    >
      <Stack
        bordered
        bg={backgroundColor ?? 'grey-900'}
        h="12"
        w="24%"
        rounded="2"
        overflow="hidden"
        position="relative"
      >
        {backgroundImageUrl && (
          <Stack position="absolute" top={0} left={0} right={0} bottom={0}>
            <Image src={backgroundImageUrl} alt="Card" contentFit="cover" height="100%" width="100%" />
          </Stack>
        )}
      </Stack>
      <YStack gap="px" justify="space-between" grow={1} w="75%">
        <XStack justify="space-between">
          <Paragraph numberOfLines={1}>{description}</Paragraph>
        </XStack>
        <Heading heading="h3" numberOfLines={1} fontWeight="semiBold" color="grey-900">
          {title}
        </Heading>
      </YStack>
    </AnimatedStack>
  )
}
