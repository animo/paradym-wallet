import {
  Button,
  Heading,
  HeroIcons,
  IdCard,
  Page,
  Paragraph,
  ScrollView,
  Spinner,
  WelcomePopup,
  XStack,
  YStack,
  useScaleAnimation,
} from '@package/ui'
import { usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'

import { useActivities } from '@easypid/features/activity/activityRecord'
import { usePidCredential } from '@easypid/hooks'
import { useWalletReset } from '@easypid/hooks/useWalletReset'
import { useNetworkCallback } from '@package/app/src/hooks'
import { ActivityRowItem } from 'packages/app'
import { useEffect } from 'react'
import Animated from 'react-native-reanimated'
import germanIssuerImage from '../../../assets/german-issuer-image.png'
import { useHasSeenIntroTooltip } from '../onboarding/hasFinishedOnboarding'

export function FunkeWalletScreen() {
  const onResetWallet = useWalletReset()
  const { push } = useRouter()
  const pathname = usePathname()
  const { isLoading, credential } = usePidCredential()
  const { bottom } = useSafeAreaInsets()
  const navigateToPidDetail = () => push('/credentials/pid')
  const navigateToScanner = useNetworkCallback(() => push('/scan'))
  const { activities, isLoading: isLoadingActivities } = useActivities()
  const [hasSeenIntroTooltip, setHasSeenIntroTooltip] = useHasSeenIntroTooltip()

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

  const onCloseIntroTooltip = () => {
    setHasSeenIntroTooltip(true)
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (pathname === '/') return
    if (!hasSeenIntroTooltip) {
      onCloseIntroTooltip()
    }
  }, [pathname, hasSeenIntroTooltip])

  if (isLoading || isLoadingActivities) {
    return (
      <Page jc="center" ai="center">
        <Spinner />
      </Page>
    )
  }

  return (
    <>
      {!hasSeenIntroTooltip && <WelcomePopup bottom={bottom} onClose={onCloseIntroTooltip} />}
      <XStack position="absolute" width="100%" zIndex={5} justifyContent="center" bottom={Math.max(bottom, 16) ?? '$6'}>
        <YStack bg="#e9e9eb" br="$12">
          <Animated.View style={qrPressStyle}>
            <YStack
              bg="$grey-900"
              br="$12"
              p="$3.5"
              m="$2.5"
              shadowOffset={{ width: 0, height: 2 }}
              shadowColor="$grey-600"
              shadowOpacity={0.3}
              shadowRadius={5}
              onPressIn={qrHandlePressIn}
              onPressOut={qrHandlePressOut}
              onPress={() => {
                navigateToScanner()
                onCloseIntroTooltip()
              }}
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
              <Heading variant="h1" fontSize={32} fontWeight="$bold">
                {credential ? `${credential.userName}'s wallet` : 'Wallet'}
              </Heading>
              <Animated.View style={menuPressStyle}>
                <XStack onPressIn={menuHandlePressIn} onPressOut={menuHandlePressOut} onPress={() => push('/menu')}>
                  <HeroIcons.Menu size={28} color="$black" />
                </XStack>
              </Animated.View>
            </XStack>
            <IdCard
              isNotReceived={!credential}
              issuerImage={germanIssuerImage}
              onPress={credential ? navigateToPidDetail : onResetWallet}
              hideUserName
            />
            <YStack gap="$4" w="100%">
              <XStack ai="center" justifyContent="space-between">
                <Heading variant="h3">Recent activity</Heading>
              </XStack>

              {activities.length === 0 ? (
                <YStack gap="$2" py="$8" ai="center" justifyContent="center" flex={1}>
                  <Heading variant="sub2">Nothing to see here, for now</Heading>
                  <Paragraph variant="sub" ta="center">
                    Setup your ID or use the QR scanner to receive credentials.
                  </Paragraph>
                </YStack>
              ) : (
                <>
                  <YStack gap="$4" w="100%">
                    {activities.slice(0, 3).map((activity) => (
                      <ActivityRowItem
                        key={activity.id}
                        id={activity.id}
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
                </>
              )}
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    </>
  )
}
