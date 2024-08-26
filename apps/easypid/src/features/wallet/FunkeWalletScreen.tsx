import {
  ActivityRowItem,
  Button,
  Heading,
  HeroIcons,
  IdCard,
  Page,
  ScrollView,
  Spinner,
  XStack,
  YStack,
} from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'

import { useActivities } from '@easypid/features/activity/activityRecord'
import { usePidCredential } from '@easypid/hooks'
import { useNetworkCallback } from '@package/app/src/hooks'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import germanIssuerImage from '../../../assets/german-issuer-image.png'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const { isLoading, credential } = usePidCredential()
  const { bottom } = useSafeAreaInsets()
  const navigateToPidDetail = () => push('/credentials/pid')
  const navigateToScanner = useNetworkCallback(() => push('/scan'))
  const { activities, isLoading: isLoadingActivities } = useActivities()

  const qrScale = useSharedValue(1)

  const qrPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: qrScale.value }],
    }
  })

  const activityScale = useSharedValue(1)

  const activityPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: activityScale.value }],
    }
  })

  if (isLoading || isLoadingActivities) {
    return (
      <Page jc="center" ai="center">
        <Spinner />
      </Page>
    )
  }

  return (
    <>
      <XStack position="absolute" width="100%" zIndex={5} justifyContent="center" bottom={bottom ?? '$6'}>
        <YStack bg="#e9e9eb" br="$12">
          <Animated.View style={qrPressStyle}>
            <YStack
              bg="$grey-900"
              br="$12"
              p="$3.5"
              m="$2.5"
              shadowOffset={{ width: 0, height: 2 }}
              shadowColor="$grey-600"
              shadowOpacity={0.6}
              shadowRadius={5}
              onPressIn={() => {
                qrScale.value = withTiming(0.95, { duration: 100 })
              }}
              onPressOut={() => {
                qrScale.value = withTiming(1, { duration: 50 })
              }}
              onPress={() => navigateToScanner()}
            >
              <HeroIcons.QrCode color="$grey-100" size={48} />
            </YStack>
          </Animated.View>
        </YStack>
      </XStack>
      <YStack bg="$background" py="$4" height="100%" position="relative">
        <ScrollView px="$4" gap="$2">
          <YStack gap="$6">
            <XStack ai="center" justifyContent="space-between">
              <Heading variant="title" fontSize={32} fontWeight="$bold">
                {credential.userName}'s wallet
              </Heading>
              <XStack p="$2" mr={-4} onPress={() => push('/menu')}>
                <HeroIcons.Menu size={28} color="$black" />
              </XStack>
            </XStack>
            <IdCard issuerImage={germanIssuerImage} onPress={navigateToPidDetail} hideUserName />
            <YStack gap="$4" w="100%">
              <XStack ai="center" justifyContent="space-between">
                <Heading variant="h3" fontWeight="$semiBold">
                  Recent activity
                </Heading>
              </XStack>
              <YStack gap="$4" w="100%">
                {activities.slice(0, 3).map((activity) => (
                  <ActivityRowItem
                    key={activity.id}
                    id={activity.id}
                    title={activity.type === 'shared' ? 'Shared data' : 'Received digital identity'}
                    subtitle={activity.entityName ?? activity.entityHost}
                    date={new Date(activity.date)}
                    type={activity.type}
                  />
                ))}
              </YStack>
              <Animated.View style={activityPressStyle}>
                <Button.Text
                  onPress={() => push('/activity')}
                  p="$2"
                  mt={-12}
                  ml={-4}
                  jc="flex-start"
                  color="$primary-500"
                  fontWeight="$semiBold"
                  fontSize="$3"
                  onPressIn={() => {
                    activityScale.value = withTiming(0.99, { duration: 100 })
                  }}
                  onPressOut={() => {
                    activityScale.value = withTiming(1, { duration: 50 })
                  }}
                >
                  More activities <HeroIcons.ArrowRight ml={-8} color="$primary-500" size={18} />
                </Button.Text>
              </Animated.View>
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
