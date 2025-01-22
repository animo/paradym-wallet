import type { CredentialDisplay } from '@package/agent'
import {
  AnimatedStack,
  Button,
  Heading,
  HeroIcons,
  Loader,
  Paragraph,
  ScrollView,
  Spacer,
  XStack,
  YStack,
  useInitialRender,
  useSpringify,
} from '@package/ui'
import * as Haptics from 'expo-haptics'
import {
  CredentialAttributes,
  DualResponseButtons,
  FunkeCredentialCard,
  useScrollViewPosition,
  useWizard,
} from 'packages/app/src'
import { useEffect, useState } from 'react'
import {
  FadeIn,
  FadeOut,
  LinearTransition,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

interface CredentialRetrievalSlideProps {
  attributes: Record<string, unknown>
  display: CredentialDisplay
  isCompleted: boolean
  onAccept: () => Promise<void>
  onDecline?: () => void
  onGoToWallet: () => void
  isAccepting?: boolean
}

export const CredentialRetrievalSlide = ({
  attributes,
  display,
  isCompleted,
  onAccept,
  onDecline,
  onGoToWallet,
  isAccepting,
}: CredentialRetrievalSlideProps) => {
  const { completeProgressBar, onCancel } = useWizard()
  const isInitialRender = useInitialRender()
  const scale = useSharedValue(1)
  const [scrollViewHeight, setScrollViewHeight] = useState<number>()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  const [isAllowedToComplete, setIsAllowedToComplete] = useState(false)
  const [isStoring, setIsStoring] = useState(false)
  const isCompleteAndAllowed = isAllowedToComplete && isCompleted
  const isStoringOrCompleted = isStoring || isCompleted
  const isAllowedToAccept = attributes && Object.keys(attributes).length > 0

  useEffect(() => {
    if (isAccepting) {
      setIsStoring(true)
    }
  }, [isAccepting])

  const handleAccept = async () => {
    setIsStoring(true)
    await onAccept()
  }

  const handleDecline = () => {
    onDecline?.()
    onCancel()
  }

  useEffect(() => {
    if (isStoring) {
      scale.value = withTiming(0.9, { duration: 2000 })
    }
    if (isCompleteAndAllowed) {
      scale.value = withSpring(1, {
        damping: 4,
        stiffness: 80,
        mass: 0.3,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      })
    }
  }, [isStoring, isCompleteAndAllowed, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
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
            opacity={isStoring ? 0 : 1}
            exiting={!isCompleteAndAllowed && !isStoring ? FadeOut.duration(100) : undefined}
          >
            {isCompleteAndAllowed ? (
              <Heading ta="center">Success!</Heading>
            ) : (
              <Heading>Is the information correct?</Heading>
            )}
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack
            key={isCompleteAndAllowed ? 'success-text' : 'info-text'}
            entering={!isInitialRender ? FadeIn.duration(300) : undefined}
            opacity={isStoring ? 0 : 1}
            exiting={!isCompleteAndAllowed && !isStoring ? FadeOut.duration(100) : undefined}
          >
            {isStoringOrCompleted ? (
              <Paragraph ta="center" mt="$-2" mb="$6">
                Card successfully added to your wallet!
              </Paragraph>
            ) : null}
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)} fg={1}>
          <AnimatedStack pb="$5" borderColor={isCompleteAndAllowed ? '$background' : '$grey-100'} style={animatedStyle}>
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
                    <CredentialAttributes
                      headerStyle="small"
                      borderStyle="large"
                      attributeWeight="medium"
                      subject={attributes}
                      disableHeader
                    />
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
            Go to wallet <HeroIcons.ArrowRight size={20} color="$white" />
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
