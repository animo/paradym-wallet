import type { ActivityType } from '@easypid/features/activity/activityRecord'
import { Heading, HeroIcons, Paragraph, Stack, XStack, YStack, useScaleAnimation } from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import Animated from 'react-native-reanimated'
import { useRouter } from 'solito/router'

const interactionIcons = {
  received: HeroIcons.CreditCard,
  shared: HeroIcons.Interaction,
}

export const activityTitleMap = {
  received: 'Received credential',
  shared: 'Shared data',
}

interface ActivityRowItemProps {
  id: string
  subtitle: string
  date: Date
  type: ActivityType
}

export function ActivityRowItem({ id, subtitle, date, type = 'shared' }: ActivityRowItemProps) {
  const router = useRouter()
  const Icon = interactionIcons[type]
  const Title = activityTitleMap[type]

  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  const onLinkPress = () => {
    if (type === 'received') {
      return router.push('/credentials/pid')
    }
    return router.push(`/activity/${id}`)
  }

  return (
    <Animated.View style={pressStyle}>
      <XStack ai="center" gap="$4" w="100%" onPress={onLinkPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Stack jc="center" ai="center" w={48} h={48} br="$12" bg="$primary-500" p="$4">
          <Icon color="$white" />
        </Stack>
        <YStack gap="$1" jc="space-between" fg={1} w="75%">
          <XStack jc="space-between">
            <Paragraph color="$grey-700">{Title}</Paragraph>
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
