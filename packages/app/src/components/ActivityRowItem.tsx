import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import type { Activity, ActivityType } from '@package/agent'
import { commonMessages } from '@package/translations'
import {
  CustomIcons,
  Heading,
  type HeroIcon,
  HeroIcons,
  Image,
  Paragraph,
  Stack,
  useScaleAnimation,
  XStack,
  YStack,
} from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import { useRouter } from 'expo-router'
import Animated from 'react-native-reanimated'
import { useHaptics } from '../hooks'

export type ActivityInteraction = {
  icon: HeroIcon[]
  color: string
  text: MessageDescriptor
}

export type ActivityInteractions = {
  [K in ActivityType]: {
    [status in (Activity & { type: K })['status']]: (activity: Activity & { type: K }) => ActivityInteraction
  }
}

export const activityInteractions: ActivityInteractions = {
  received: {
    success: () => ({
      icon: [HeroIcons.Plus],
      color: '$feature-500',
      text: commonMessages.cardAdded,
    }),
    pending: () => ({
      icon: [HeroIcons.ClockFilled],
      color: '$warning-500',
      text: commonMessages.cardPending,
    }),
    stopped: () => ({
      icon: [HeroIcons.HandRaisedFilled],
      color: '$grey-500',
      text: commonMessages.cardRejected,
    }),
    failed: () => ({
      icon: [CustomIcons.Exclamation],
      color: '$danger-500',
      text: commonMessages.cardNotAdded,
    }),
  },
  signed: {
    success: (activity) => {
      const hasQes = activity.transactions?.some((t) => t.type === 'qes_authorization')
      const hasPayment = activity.transactions?.some((t) => t.type === 'urn:eudi:sca:payment:1')
      const hasGeneric = activity.transactions?.some(
        (t) => t.type !== 'qes_authorization' && t.type !== 'urn:eudi:sca:payment:1'
      )

      const icons: HeroIcon[] = []
      if (hasQes) icons.push(HeroIcons.PenFilled)
      if (hasPayment) icons.push(HeroIcons.CreditCardFilled)
      if (hasGeneric) icons.push(HeroIcons.Interaction)

      // Fallback if no transactions or unknown types (shouldn't happen for signed)
      if (icons.length === 0) icons.push(HeroIcons.PenFilled)

      let text = commonMessages.documentSigned
      if (hasPayment && !hasQes && !hasGeneric) text = commonMessages.paymentApproved
      if (hasGeneric && !hasQes && !hasPayment) text = commonMessages.transactionApproved
      if (icons.length > 1) text = commonMessages.transactionApproved // Generic text for mixed types

      return {
        icon: icons,
        color: '#008FFF',
        text,
      }
    },
    stopped: (activity) => {
      const hasPayment = activity.transactions?.some((t) => t.type === 'urn:eudi:sca:payment:1')
      const hasGeneric = activity.transactions?.some(
        (t) => t.type !== 'qes_authorization' && t.type !== 'urn:eudi:sca:payment:1'
      )
      const hasQes = activity.transactions?.some((t) => t.type === 'qes_authorization')

      let text = commonMessages.signingStopped
      if (hasPayment && !hasQes && !hasGeneric) text = commonMessages.paymentStopped
      if (hasGeneric && !hasQes && !hasPayment) text = commonMessages.transactionStopped

      return {
        icon: [HeroIcons.HandRaisedFilled],
        color: '$grey-500',
        text,
      }
    },
    failed: (activity) => {
      const hasPayment = activity.transactions?.some((t) => t.type === 'urn:eudi:sca:payment:1')
      const hasGeneric = activity.transactions?.some(
        (t) => t.type !== 'qes_authorization' && t.type !== 'urn:eudi:sca:payment:1'
      )
      const hasQes = activity.transactions?.some((t) => t.type === 'qes_authorization')

      let text = commonMessages.signingFailed
      if (hasPayment && !hasQes && !hasGeneric) text = commonMessages.paymentFailed
      if (hasGeneric && !hasQes && !hasPayment) text = commonMessages.transactionFailed

      return {
        icon: [CustomIcons.Exclamation],
        color: '$danger-500',
        text,
      }
    },
  },
  shared: {
    success: () => ({
      icon: [HeroIcons.Interaction],
      color: '$positive-500',
      text: commonMessages.informationShared,
    }),
    stopped: () => ({
      icon: [HeroIcons.HandRaisedFilled],
      color: '$grey-500',
      text: commonMessages.sharingStopped,
    }),
    failed: () => ({
      icon: [CustomIcons.Exclamation],
      color: '$danger-500',
      text: commonMessages.sharingFailed,
    }),
  },
}

export const getActivityInteraction = (activity: Activity) => {
  const byType = activityInteractions[activity.type] as {
    [status in (Activity & { type: (typeof activity)['type'] })['status']]: (activity: Activity) => ActivityInteraction
  }

  return byType[activity.status](activity)
}

interface ActivityRowItemProps {
  activity: Activity
}

export function ActivityRowItem({ activity }: ActivityRowItemProps) {
  const { t } = useLingui()
  const { id, entity } = activity
  const { logo, backgroundColor } = entity
  const date = new Date(activity.date)
  const subtitle = entity.name ?? entity.host ?? t(commonMessages.unknownOrganization)

  const router = useRouter()
  const interaction = getActivityInteraction(activity)
  const Title = t(interaction.text)

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
          <Stack pos="absolute" top={-4} left={-4} flexDirection="row">
            {interaction.icon.map((Icon, index) => (
              <Stack
                key={index}
                overflow="hidden"
                bg={interaction.color}
                br="$12"
                p="$1"
                bw="$1"
                boc="$white"
                ml={index > 0 ? -4 : 0} // Overlap icons by width (10px icon + 2px padding + 2px border = 14px total width approx, so -10 is a good overlap)
                zIndex={interaction.icon.length - index}
              >
                <Icon strokeWidth={3} size={10} color="$white" />
              </Stack>
            ))}
          </Stack>
        </Stack>
        <YStack gap="$0.5" jc="space-between" fg={1} w="75%">
          <XStack jc="space-between">
            <Paragraph>{Title}</Paragraph>
            <Paragraph variant="annotation" color="$grey-500" fontWeight="$regular">
              {formatRelativeDate(date)}
            </Paragraph>
          </XStack>
          <Heading heading="h3" numberOfLines={1} fontWeight="$semiBold" color="$grey-900">
            {subtitle}
          </Heading>
        </YStack>
      </XStack>
    </Animated.View>
  )
}
