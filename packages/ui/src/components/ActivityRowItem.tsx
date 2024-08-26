import { formatRelativeDate } from '@package/utils'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useRouter } from 'solito/router'
import { Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { HeroIcons } from '../content'

const interactionIcons = {
  received: HeroIcons.CreditCard,
  shared: HeroIcons.Interaction,
}

const title = {
  received: 'Received credential',
  shared: 'Shared data',
}

export function ActivityRowItem({
  id,
  subtitle,
  date,
  type = 'shared',
}: { id: string; title: string; subtitle: string; date: Date; type?: 'shared' | 'received' }) {
  const router = useRouter()
  const Icon = interactionIcons[type]
  const Title = title[type]

  const scale = useSharedValue(1)

  const pressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 50 })
  }

  return (
    <Animated.View style={pressStyle}>
      <XStack
        gap="$4"
        w="100%"
        onPress={() => router.push(`/activity/${id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Stack jc="center" ai="center" w={48} h={48} br="$12" bg="$primary-500" p="$4">
          <Icon color="$white" />
        </Stack>
        <YStack gap="$1" jc="space-between" fg={1} w="75%">
          <XStack jc="space-between">
            <Paragraph fontSize={15} color="$grey-500">
              {Title}
            </Paragraph>
            <Paragraph variant="annotation" color="$grey-500" fontWeight="$regular">
              {formatRelativeDate(date)}
            </Paragraph>
          </XStack>
          <Heading variant="h3" numberOfLines={1} fontWeight="$semiBold" color="$grey-900">
            {subtitle}
          </Heading>
        </YStack>
      </XStack>
    </Animated.View>
  )
}
