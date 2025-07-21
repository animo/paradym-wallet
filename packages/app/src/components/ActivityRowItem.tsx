import type { ActivityType } from '@easypid/features/activity/activityRecord'
import { useLingui } from '@lingui/react/macro'
import type { DisplayImage } from '@package/agent'
import { commonMessages } from '@package/translations'
import {
  CustomIcons,
  Heading,
  HeroIcons,
  Image,
  Paragraph,
  Stack,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import { useRouter } from 'expo-router'
import Animated from 'react-native-reanimated'
import { useHaptics } from '../hooks'

export const activityInteractions = {
  received: {
    success: {
      icon: HeroIcons.Plus,
      color: '$feature-500',
      text: commonMessages.cardAdded,
    },
    stopped: {
      icon: HeroIcons.HandRaisedFilled,
      color: '$grey-500',
      text: commonMessages.cardRejected,
    },
    failed: {
      icon: CustomIcons.Exclamation,
      color: '$danger-500',
      text: commonMessages.cardNotAdded,
    },
  },
  signed: {
    success: {
      icon: HeroIcons.PenFilled,
      color: '#008FFF',
      text: commonMessages.documentSigned,
    },
    stopped: {
      icon: HeroIcons.HandRaisedFilled,
      color: '$grey-500',
      text: commonMessages.signingStopped,
    },
    failed: {
      icon: CustomIcons.Exclamation,
      color: '$danger-500',
      text: commonMessages.signingFailed,
    },
  },
  shared: {
    success: {
      icon: HeroIcons.Interaction,
      color: '$positive-500',
      text: commonMessages.informationShared,
    },
    stopped: {
      icon: HeroIcons.HandRaisedFilled,
      color: '$grey-500',
      text: commonMessages.sharingStopped,
    },
    failed: {
      icon: CustomIcons.Exclamation,
      color: '$danger-500',
      text: commonMessages.sharingFailed,
    },
  },
}

interface ActivityRowItemProps {
  id: string
  logo?: DisplayImage
  status: 'success' | 'stopped' | 'failed'
  backgroundColor?: string
  subtitle: string
  date: Date
  type: ActivityType
}

export function ActivityRowItem({
  id,
  logo,
  backgroundColor,
  subtitle,
  date,
  type = 'shared',
  status = 'success',
}: ActivityRowItemProps) {
  const router = useRouter()
  const { t } = useLingui()
  const Icon = type === 'received' ? activityInteractions.received.success : activityInteractions[type][status]
  const Title =
    type === 'received' ? t(activityInteractions.received.success.text) : t(activityInteractions[type][status].text)

  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()
  const { withHaptics } = useHaptics()

  const onLinkPress = withHaptics(() => {
    return router.push(`/activity/${id}`)
  })

  return (
    <Animated.View style={pressStyle}>
      <XStack
        accessible={true}
        accessibilityRole="button"
        aria-label={`${Title} activity from ${subtitle}`}
        ai="center"
        gap="$4"
        w="100%"
        onPress={onLinkPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Stack pos="relative">
          <Stack
            jc="center"
            ai="center"
            w={48}
            h={48}
            br="$12"
            bg={backgroundColor ?? '$grey-50'}
            bw={logo?.url ? 0.5 : 0}
            borderColor="$grey-100"
            overflow="hidden"
          >
            {logo?.url ? (
              <Image src={logo.url} alt={logo.altText} width="100%" height="100%" contentFit="contain" />
            ) : (
              <HeroIcons.BuildingOffice strokeWidth={2} color="$grey-500" />
            )}
          </Stack>
          <Stack overflow="hidden" pos="absolute" bg={Icon.color} br="$12" p="$1" bw="$1" boc="$white">
            <Icon.icon strokeWidth={3} size={10} color="$white" />
          </Stack>
        </Stack>
        <YStack gap="$0.5" jc="space-between" fg={1} w="75%">
          <XStack jc="space-between">
            <Paragraph>{Title}</Paragraph>
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
