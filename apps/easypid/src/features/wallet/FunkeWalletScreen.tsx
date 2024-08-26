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
import { useNetworkCallback, useScaleAnimation } from '@package/app/src/hooks'
import Animated from 'react-native-reanimated'
import germanIssuerImage from '../../../assets/german-issuer-image.png'

export function FunkeWalletScreen() {
  const { push } = useRouter()
  const { isLoading, credential } = usePidCredential()
  const { bottom } = useSafeAreaInsets()
  const navigateToPidDetail = () => push('/credentials/pid')
  const navigateToScanner = useNetworkCallback(() => push('/scan'))
  const { activities, isLoading: isLoadingActivities } = useActivities()

  const {
    pressStyle: qrPressStyle,
    handlePressIn: qrHandlePressIn,
    handlePressOut: qrHandlePressOut,
  } = useScaleAnimation({ scaleInValue: 0.95 })

  const {
    pressStyle: activityPressStyle,
    handlePressIn: activityHandlePressIn,
    handlePressOut: activityHandlePressOut,
  } = useScaleAnimation({ scaleInValue: 0.99 })

  const {
    handlePressIn: menuHandlePressIn,
    handlePressOut: menuHandlePressOut,
    pressStyle: menuPressStyle,
  } = useScaleAnimation({ scaleInValue: 0.9 })

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
              onPressIn={qrHandlePressIn}
              onPressOut={qrHandlePressOut}
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
              <Animated.View style={menuPressStyle}>
                <XStack onPressIn={menuHandlePressIn} onPressOut={menuHandlePressOut} onPress={() => push('/menu')}>
                  <HeroIcons.Menu size={28} color="$black" />
                </XStack>
              </Animated.View>
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
              {activities.length > 3 && (
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
                    onPressIn={activityHandlePressIn}
                    onPressOut={activityHandlePressOut}
                  >
                    View all activity <HeroIcons.ArrowRight ml={-8} color="$primary-500" size={18} />
                  </Button.Text>
                </Animated.View>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
