import { Trans, useLingui } from '@lingui/react/macro'
import {
  CredentialAttributes,
  CredentialCard,
  DualResponseButtons,
  SlidePane,
  useScrollViewPosition,
  useWizard,
} from '@package/app'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  Button,
  Circle,
  Heading,
  HeroIcons,
  Image,
  Loader,
  Paragraph,
  ScrollView,
  type ScrollViewRefType,
  Spacer,
  TwoPane,
  useSpringify,
  XStack,
  YStack,
} from '@package/ui'
import type { CredentialDisplay, CredentialForDisplay, FormattedAttribute } from '@paradym/wallet-sdk'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
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
import {
  CustomCredentialAttributes,
  hasCustomCredentialDisplay,
} from '../../wallet/components/CustomCredentialAttributes'

interface CredentialRetrievalSlideProps {
  attributes?: FormattedAttribute[]
  deferred?: boolean
  display: CredentialDisplay
  isCompleted: boolean
  onAccept: () => Promise<void>
  onGoToWallet: () => void
  isAccepting?: boolean
  // Wide windows show its custom layout, when it has one, instead of the plain attributes
  credential?: CredentialForDisplay
}

export const CredentialRetrievalSlide = ({
  attributes,
  deferred,
  display,
  isCompleted,
  onAccept,
  onGoToWallet,
  isAccepting,
  credential,
}: CredentialRetrievalSlideProps) => {
  const { completeProgressBar, onCancel, ownsWideLayout } = useWizard()
  const scale = useSharedValue(1)
  const textOpacity = useSharedValue(0)
  const [scrollViewHeight, setScrollViewHeight] = useState<number>()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const scrollViewRef = useRef<ScrollViewRefType>(null)
  const { t } = useLingui()

  const [isAllowedToComplete, setIsAllowedToComplete] = useState(false)
  const [isStoring, setIsStoring] = useState(isAccepting ?? false)
  const isCompleteAndAllowed = isAllowedToComplete && isCompleted
  const isStoringOrCompleted = isStoring || isCompleted
  const isAllowedToAccept = (attributes && attributes.length > 0) || deferred

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
  })

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    }
  })

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

  const header = (
    <>
      {isStoringOrCompleted && (
        <AnimatedStack
          key={isCompleteAndAllowed ? 'success-icon' : 'info-icon'}
          style={{
            opacity: isCompleteAndAllowed ? 1 : 0,
          }}
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
          entering={FadeIn.duration(300)}
          exiting={!isCompleteAndAllowed && !isStoring ? FadeOut.duration(100) : undefined}
        >
          <AnimatedStack style={animatedTextStyle}>
            {isCompleted ? (
              <Heading ta="center">{t(commonMessages.success)}</Heading>
            ) : isStoring ? (
              <Heading></Heading>
            ) : deferred ? (
              <Heading>
                <Trans id="receiveCredential.deferredCredentialHeader">Card is not ready yet</Trans>
              </Heading>
            ) : (
              <Heading>
                <Trans id="receiveCredential.checkInformationHeader">Do you want to store this card?</Trans>
              </Heading>
            )}
          </AnimatedStack>
        </AnimatedStack>
      </AnimatedStack>
      <AnimatedStack layout={useSpringify(LinearTransition)}>
        <AnimatedStack
          key={isCompleteAndAllowed ? 'success-text' : 'info-text'}
          entering={FadeIn.duration(300)}
          exiting={!isCompleteAndAllowed && !isStoring ? FadeOut.duration(100) : undefined}
        >
          <AnimatedStack style={animatedTextStyle}>
            {isCompleted ? (
              <Paragraph ta="center" mt="$-2" mb="$6">
                <Trans id="retrieveCredential.cardSuccessfully added">Card successfully added to your wallet!</Trans>
              </Paragraph>
            ) : isStoring ? (
              <Paragraph ta="center" mt="$-2" mb="$6"></Paragraph>
            ) : deferred ? (
              <Paragraph ta="center" mt="$-2" mb="$6">
                <Trans id="retrieveCredential.cardPending">The card will be fetched once available.</Trans>
              </Paragraph>
            ) : null}
          </AnimatedStack>
        </AnimatedStack>
      </AnimatedStack>
    </>
  )

  const card = (
    <AnimatedStack pb="$5" borderColor={isCompleteAndAllowed ? '$background' : '$grey-100'} style={animatedCardStyle}>
      <CredentialCard
        issuerImage={display.issuer.logo}
        textColor={display.textColor}
        name={display.name ?? t(commonMessages.unknown)}
        backgroundImage={display.backgroundImage}
        bgColor={display.backgroundColor}
        isLoading={isStoring && !isCompleteAndAllowed}
      />
    </AnimatedStack>
  )

  const details = (
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
          ref={scrollViewRef}
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
              {ownsWideLayout && credential && hasCustomCredentialDisplay(credential.metadata.type) ? (
                <CustomCredentialAttributes credential={credential} scrollRef={scrollViewRef} />
              ) : attributes ? (
                <CredentialAttributes attributes={attributes} scrollRef={scrollViewRef} />
              ) : (
                <Paragraph>
                  <Trans id="receiveCredential.deferredCredentialParagraph">
                    Your cards are not yet ready. We will check once in a while in the background and fetch the cards
                    once they're ready.
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
  )

  const footer = (
    <AnimatedStack layout={LinearTransition}>
      <AnimatedStack
        key={isCompleteAndAllowed ? 'success' : 'error'}
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
    </AnimatedStack>
  )

  if (ownsWideLayout) {
    // Wide windows keep the card and who issues it on the left, next to the attributes and later the success message
    return (
      <TwoPane
        start={
          <SlidePane>
            <YStack fg={1} jc="center" ai="center" gap="$4">
              <YStack w="100%" maxWidth={340}>
                {card}
              </YStack>
              <YStack ai="center" gap="$2">
                <Heading heading="h2" ta="center">
                  {display.name ?? t(commonMessages.unknown)}
                </Heading>
                {display.issuer.name && (
                  <XStack ai="center" gap="$2">
                    {display.issuer.logo?.url && (
                      <Circle size={28} overflow="hidden" bw="$0.5" borderColor="$grey-100" bg="$white">
                        <Image src={display.issuer.logo.url} width="100%" height="100%" contentFit="contain" />
                      </Circle>
                    )}
                    <Paragraph>
                      <Trans id="common.issuedBy" comment="Prefix before issuer name">
                        Issued by {display.issuer.name}.
                      </Trans>
                    </Paragraph>
                  </XStack>
                )}
              </YStack>
            </YStack>
          </SlidePane>
        }
        end={
          <SlidePane>
            <YStack fg={1} jc="space-between">
              <AnimatedStack gap="$4" fg={1} jc={isCompleted ? 'center' : undefined}>
                {header}
                {!isCompleted && details}
              </AnimatedStack>
              {footer}
            </YStack>
          </SlidePane>
        }
      />
    )
  }

  return (
    <YStack fg={1} jc="space-between">
      <AnimatedStack gap="$4" fg={1}>
        {header}
        <AnimatedStack layout={useSpringify(LinearTransition)} fg={1}>
          {card}
          {details}
        </AnimatedStack>
      </AnimatedStack>
      {footer}
    </YStack>
  )
}
