import type { CredentialMetadata, FormattedSubmission } from '@package/agent'
import {
  Button,
  Heading,
  HeroIcons,
  IdCardRequestedAttributesSection,
  Paragraph,
  ProgressBar,
  ScrollView,
  Spacer,
  Stack,
  XStack,
  YStack,
  ZStack,
} from '@package/ui'
import React, { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Circle } from 'tamagui'
import germanIssuerImage from '../../../assets/german-issuer-image.png'

import type { ClaimFormat } from '@credo-ts/core'
import { getPidAttributesForDisplay, getPidDisclosedAttributeNames } from '@easypid/hooks'
import { DualResponseButtons, useScrollViewPosition } from '@package/app'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

interface FunkePresentationNotificationScreenProps {
  submission: FormattedSubmission
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
  verifierHost?: string
}

export function FunkePresentationNotificationScreen({
  onAccept,
  onDecline,
  isAccepting,
  submission,
  verifierHost,
}: FunkePresentationNotificationScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const router = useRouter()
  const { top, bottom } = useSafeAreaInsets()

  const entry = submission.entries[0]
  const credential = entry?.credentials[0] as (typeof entry)['credentials'][0] | undefined

  const disclosedAttributes = getPidDisclosedAttributeNames(
    credential?.disclosedPayload ?? {},
    credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
  )

  const disclosedPayload = getPidAttributesForDisplay(
    credential?.disclosedPayload ?? {},
    credential?.metadata ?? ({} as CredentialMetadata),
    credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
  )

  const onStop = () => {
    Alert.alert('Stop', 'Are you sure you want to stop sharing?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          router.replace('/')
        },
      },
    ])
  }

  // Tamagui has an issue with the entering animation of the progressbar
  // So we overwrite it with our own animation.
  const progressWidth = useSharedValue(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    progressWidth.value = withTiming(10, { duration: 5000, easing: Easing.inOut(Easing.ease) })
  }, [])

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }))

  return (
    <YStack background="$background" height="100%">
      {/* This is the header where the scroll view get's behind. We have the same content in the scrollview, but you
       * don't see that content. It's just so we can make the scrollview minheight 100%.  */}
      <YStack px="$4" zIndex={2} w="100%" bg="$background" position="absolute">
        <Stack h={top} />
        <XStack jc="space-between">
          <Stack ml={-4} p="$2" onPress={onStop}>
            <HeroIcons.ArrowLeft size={28} color="$black" />
          </Stack>
        </XStack>
        <YStack borderWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'} />
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '100%' }}
      >
        <Spacer size="$13" />
        <YStack borderWidth={0.5} borderColor="$background" />
        <YStack gap="$6" jc="space-between" p="$4" paddingBottom={bottom} flex-1>
          <Stack gap="$6">
            <Animated.View entering={FadeIn}>
              <YStack gap="$2">
                <ZStack mb="$4">
                  <Stack h={12.5} mt={-1} bg="$grey-200" br="$3" />
                  <Animated.View key="progress-bar-anim" style={animatedProgressStyle}>
                    <ProgressBar value={33} />
                  </Animated.View>
                </ZStack>
                <Heading variant="title">Review the request</Heading>
              </YStack>
            </Animated.View>
            <Animated.View
              entering={FadeInDown.springify().damping(128).mass(0.8).stiffness(200).restSpeedThreshold(0.1).delay(200)}
            >
              <YStack gap="$6">
                <IdCardRequestedAttributesSection
                  disclosedAttributes={submission.areAllSatisfied ? disclosedAttributes : []}
                  description={
                    !submission.areAllSatisfied
                      ? "You don't have the requested credential."
                      : disclosedAttributes.length > 1
                        ? `These ${disclosedAttributes.length} attributes will be shared.`
                        : 'The following attribute will be shared:'
                  }
                  issuerImage={germanIssuerImage}
                  onPressIdCard={() => {
                    router.push(
                      `/credentials/pidRequestedAttributes?disclosedPayload=${encodeURIComponent(JSON.stringify(disclosedPayload ?? {}))}&disclosedAttributeLength=${disclosedAttributes?.length ?? 0}`
                    )
                  }}
                />

                <YStack gap="$2">
                  <Circle size="$2" mb="$2" backgroundColor="$primary-500">
                    <HeroIcons.InformationCircle color="$white" size={18} />
                  </Circle>
                  <Heading variant="h3" fontWeight="$semiBold">
                    Reason for request
                  </Heading>
                  <Paragraph size="$3" secondary>
                    {submission.purpose ??
                      submission.entries[0].description ??
                      'No information was provided on the purpose of the data request. Be cautious'}
                  </Paragraph>
                </YStack>

                {verifierHost && (
                  <YStack gap="$2">
                    <Circle size="$2.5" mb="$2" backgroundColor="$primary-500">
                      <HeroIcons.User color="$white" size={18} />
                    </Circle>
                    <Heading variant="h3" fontWeight="$semiBold">
                      Requester
                    </Heading>
                    <Paragraph size="$3" secondary>
                      {verifierHost}
                    </Paragraph>
                  </YStack>
                )}
              </YStack>
            </Animated.View>
          </Stack>

          <Animated.View entering={FadeInDown.delay(400)}>
            {submission.areAllSatisfied ? (
              <DualResponseButtons
                align="horizontal"
                acceptText="Share"
                declineText="Stop"
                onAccept={onAccept}
                onDecline={onDecline}
                isAccepting={isAccepting}
              />
            ) : (
              <YStack gap="$3">
                <Paragraph variant="sub" ta="center">
                  You don't have the required credentials
                </Paragraph>
                <Button.Solid onPress={onDecline}>Close</Button.Solid>
              </YStack>
            )}
          </Animated.View>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
