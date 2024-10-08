import type { ActivityType } from '@easypid/features/activity/activityRecord'
import {
  Heading,
  HeroIcons,
  Paragraph,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
  useToastController,
} from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import Animated from 'react-native-reanimated'
import { useRouter } from 'solito/router'

const interactionIcons = {
  received: HeroIcons.CreditCardFilled,
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
  credentialId?: string
}

export function ActivityRowItem({ id, subtitle, date, type = 'shared', credentialId }: ActivityRowItemProps) {
  const router = useRouter()
  const toast = useToastController()
  const Icon = interactionIcons[type]
  const Title = activityTitleMap[type]

  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  const onLinkPress = () => {
    if (type === 'shared') return router.push(`/activity/${id}`)
    if (type === 'received' && credentialId) return router.push(`/credentials/${credentialId}`)
    return toast.show('Currently unavailable.', {
      customData: {
        preset: 'warning',
      },
    })
  }

  return (
    <Animated.View style={pressStyle}>
      <XStack ai="center" gap="$4" w="100%" onPress={onLinkPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Stack jc="center" ai="center" w={48} h={48} br="$12" bg="$primary-500" p="$4">
          <Icon strokeWidth={2} color="$white" />
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
