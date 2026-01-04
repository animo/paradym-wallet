import { Trans, useLingui } from '@lingui/react/macro'
import type { CredentialDisplay } from '@package/agent'
import {
  CredentialAttributes,
  DualResponseButtons,
  FunkeCredentialCard,
  useScrollViewPosition,
  useWizard,
} from '@package/app'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  Button,
  Heading,
  HeroIcons,
  Loader,
  Paragraph,
  ScrollView,
  Spacer,
  useInitialRender,
  useSpringify,
  XStack,
  YStack,
} from '@package/ui'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated'

interface CredentialRetrievalSlideProps {
  attributes?: Record<string, unknown>
  deferred?: boolean
  display: CredentialDisplay
  isCompleted: boolean
  onAccept: () => Promise<void>
  onGoToWallet: () => void
  isAccepting?: boolean
}

export const CredentialRetrievalSlide = ({
  attributes,
  deferred,
  display,
  isCompleted,
  onAccept,
  onGoToWallet,
  isAccepting,
}: CredentialRetrievalSlideProps) => {
  const { completeProgressBar, onCancel } = useWizard()
  const isInitialRender = useInitialRender()
  const scale = useSharedValue(1)
  const textOpacity = useSharedValue(1)
  const [scrollViewHeight, setScrollViewHeight] = useState<number>()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { t } = useLingui()

  const [isAllowedToComplete, setIsAllowedToComplete] = useState(false)
  const [isStoring, setIsStoring] = useState(isAccepting ?? false)
  const isCompleteAndAllowed = isAllowedToComplete && isCompleted
  const isStoringOrCompleted = isStoring || isCompleted
  const isAllowedToAccept = (attributes && Object.keys(attributes).length > 0) || deferred

  const handleAccept = async () => {
    setIsStoring(true)
    await onAccept()
  }

  const handleDecline = () => {
    onCancel()
  }

  useEffect(() => {
    if (isStoring) {
      scale.value = withTiming(0.9, { duration: 2000 })
      textOpacity.value = withTiming(0, { duration: 300 })
    } else {
      textOpacity.value = withTiming(1, { duration: 300 })
    }
    if (isCompleteAndAllowed) {
      scale.value = withSpring(1, {
        damping: 4,
        stiffness: 80,
        mass: 0.3,
      })
    }
  }, [isStoring, isCompleteAndAllowed, scale, textOpacity])

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  }, [])

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    }
  }, [])

  // Haptic feedback for storing and completion states
  useEffect(() => {
    if (isStoring && !isCompleteAndAllowed) {
      // Initial haptic feedback when storing starts
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      const interval = setInterval(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }, 300)

      return () => clearInterval(interval)
    }
  }, [isStoring, isCompleteAndAllowed])

  // Delay the completion by 1 second to show the storing animation
  useEffect(() => {
    if (isStoring) {
      const timer = setTimeout(() => {
        setIsAllowedToComplete(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isStoring])

  // Wait for the credential to be accepted and the minimum animation time to be reached
  useEffect(() => {
    if (isCompleteAndAllowed) {
      completeProgressBar()
      setIsStoring(false)
    }
  }, [isCompleteAndAllowed, completeProgressBar])

  return (
    <YStack fg={1} jc="space-between">
      <AnimatedStack gap="$4" fg={1}>
        {isStoringOrCompleted && (
          <AnimatedStack
            key={isCompleteAndAllowed ? 'success-icon' : 'info-icon'}
            opacity={isCompleteAndAllowed ? 1 : 0}
            entering={useSpringify(ZoomIn)}
          >
            <XStack pt="$4" jc="center">
              <HeroIcons.ShieldCheckFilled color="$primary-500" size={48} />
            </XStack>
          </AnimatedStack>
        )}
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack
            key={isCompleteAndAllowed ? 'success-title' : 'info-title'}
            entering={!isInitialRender ? FadeIn.duration(300) : undefined}
            style={animatedTextStyle}
            exiting={!isCompleteAndAllowed && !isStoring ? FadeOut.duration(100) : undefined}
          >
            {isCompleted ? (
              <Heading ta="center">
                <Trans id="receiveCredential.successHeader">Success!</Trans>
              </Heading>
            ) : isStoring ? (
              <Heading> </Heading>
            ) : deferred ? (
              <Heading>
                <Trans id="receiveCredential.deferredCredentialHeader">Card is not ready yet</Trans>
              </Heading>
            ) : (
              <Heading>
                <Trans id="receiveCredential.checkInformationHeader">Is the information correct?</Trans>
              </Heading>
            )}
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack
            key={isCompleteAndAllowed ? 'success-text' : 'info-text'}
            entering={!isInitialRender ? FadeIn.duration(300) : undefined}
            style={animatedTextStyle}
            exiting={!isCompleteAndAllowed && !isStoring ? FadeOut.duration(100) : undefined}
          >
            {isStoringOrCompleted ? (
              deferred ? (
                <Paragraph ta="center" mt="$-2" mb="$6">
                  <Trans id="retrieveCredential.cardPending">The card will be fetched once available.</Trans>
                </Paragraph>
              ) : (
                <Paragraph ta="center" mt="$-2" mb="$6">
                  <Trans id="retrieveCredential.cardSuccessfully added">Card successfully added to your wallet!</Trans>
                </Paragraph>
              )
            ) : null}
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)} fg={1}>
          <AnimatedStack
            pb="$5"
            borderColor={isCompleteAndAllowed ? '$background' : '$grey-100'}
            style={animatedCardStyle}
          >
            <FunkeCredentialCard
              issuerImage={display.issuer.logo}
              textColor={display.textColor}
              name={display.name}
              backgroundImage={display.backgroundImage}
              bgColor={display.backgroundColor}
              isLoading={isStoring && !isCompleteAndAllowed}
            />
          </AnimatedStack>
          <AnimatedStack
            fg={1}
            btw="$0.5"
            px="$4"
            mx="$-4"
            borderColor={isScrolledByOffset && !isStoringOrCompleted ? '$grey-200' : '$background'}
            onLayout={(event) => {
              // Set the initial height of the stack to define the maxHeight of the scrollView
              if (!scrollViewHeight) {
                setScrollViewHeight(event.nativeEvent.layout.height)
              }
            }}
          >
            {!isStoringOrCompleted ? (
              <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={scrollEventThrottle}
                px="$4"
                mx="$-4"
                maxHeight={scrollViewHeight}
                bg="$white"
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {scrollViewHeight && isAllowedToAccept ? (
                  <AnimatedStack key="credential-attributes" entering={FadeIn.duration(200)}>
                    {attributes ? (
                      <CredentialAttributes attributes={attributes} />
                    ) : (
                      <Paragraph>
                        <Trans id="receiveCredential.deferredCredentialParagraph">
                          Your cards are not yet ready. We will check once in a while in the background and fetch the
                          cards once they're ready.
                        </Trans>
                      </Paragraph>
                    )}
                  </AnimatedStack>
                ) : (
                  <YStack fg={1} jc="center" ai="center">
                    <Loader />
                  </YStack>
                )}
                <Spacer size="$6" />
              </ScrollView>
            ) : (
              <Spacer size="$6" />
            )}
          </AnimatedStack>
        </AnimatedStack>
      </AnimatedStack>
      <AnimatedStack
        key={isCompleteAndAllowed ? 'success' : 'error'}
        layout={LinearTransition}
        entering={isCompleteAndAllowed ? FadeIn.duration(300).delay(500) : undefined}
        exiting={FadeOut.duration(100)}
        btw="$0.5"
        borderColor={isStoringOrCompleted ? '$background' : '$grey-200'}
        p="$4"
        mx="$-4"
        bg="$background"
      >
        {isStoringOrCompleted ? (
          <Button.Solid opacity={isCompleteAndAllowed ? 1 : 0} onPress={onGoToWallet}>
            {t(commonMessages.goToWallet)} <HeroIcons.ArrowRight size={20} color="$white" />
          </Button.Solid>
        ) : (
          <DualResponseButtons
            align="horizontal"
            isLoading={!isAllowedToAccept}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}
      </AnimatedStack>
    </YStack>
  )
}
