import type { CredentialDisplay } from '@package/agent'
import {
  AnimatedStack,
  Button,
  Heading,
  HeroIcons,
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

interface OfferCredentialSlideProps {
  // credentialRecord?: SdJwtVcRecord | W3cCredentialRecord | MdocRecord
  // If no attributes, we should at least render the metadata attributes placeholders
  attributes?: Record<string, unknown>
  display: CredentialDisplay
  isStoring: boolean
  isAccepted: boolean
  onAccept: () => Promise<void>
  onDecline: () => void
  onComplete: () => void
}

export const OfferCredentialSlide = ({
  isAccepted,
  isStoring,
  onAccept,
  onDecline,
  onComplete,
  display,
  attributes,
}: OfferCredentialSlideProps) => {
  const { completeProgressBar } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const isInitialRender = useInitialRender()
  const [isCompleted, setIsCompleted] = useState(false)
  const [isAllowedToComplete, setIsAllowedToComplete] = useState(false)
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const scale = useSharedValue(1)

  const hideTextWhileStoring = isStoring && !isCompleted
  const isStoringOrCompleted = isStoring || isCompleted
  const waitForAcceptState = !isCompleted && !isStoring

  // if (!credentialRecord) {
  //   return null
  // }

  // const { display, attributes } = getCredentialForDisplay(credentialRecord)

  const handleAccept = async () => {
    await onAccept()
  }

  const handleDecline = () => {
    onDecline()
  }

  useEffect(() => {
    if (isStoring) {
      scale.value = withTiming(0.9, { duration: 2000 })
    }
    if (isCompleted) {
      scale.value = withSpring(1, {
        damping: 4,
        stiffness: 80,
        mass: 0.3,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      })
    }
  }, [isStoring, isCompleted, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  }, [])

  // Slow haptic when isStoring and a hard tick when isCompleted
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (isCompleted) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } else if (isStoring) {
      interval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }, 300)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isStoring, isCompleted])

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
    if (isAccepted && isAllowedToComplete) {
      setIsCompleted(true)
      completeProgressBar()
    }
  }, [isAccepted, isAllowedToComplete, completeProgressBar])

  return (
    <YStack fg={1} jc="space-between">
      <AnimatedStack gap="$4" fg={1}>
        {isStoringOrCompleted && (
          <AnimatedStack
            key={isCompleted ? 'success-icon' : 'info-icon'}
            opacity={isCompleted ? 1 : 0}
            entering={useSpringify(ZoomIn)}
          >
            <XStack pt="$4" jc="center">
              <HeroIcons.ShieldCheckFilled color="$primary-500" size={48} />
            </XStack>
          </AnimatedStack>
        )}
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack
            key={isCompleted ? 'success-title' : 'info-title'}
            entering={!isInitialRender ? FadeIn.duration(300) : undefined}
            opacity={hideTextWhileStoring ? 0 : 1}
            exiting={waitForAcceptState ? FadeOut.duration(100) : undefined}
          >
            {isCompleted ? <Heading ta="center">Success!</Heading> : <Heading>Is the information correct?</Heading>}
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack
            key={isCompleted ? 'success-text' : 'info-text'}
            entering={!isInitialRender ? FadeIn.duration(300) : undefined}
            opacity={hideTextWhileStoring ? 0 : 1}
            exiting={waitForAcceptState ? FadeOut.duration(100) : undefined}
          >
            {isStoringOrCompleted ? (
              <Paragraph ta="center" mt="$-2" mb="$6">
                Card successfully added to your wallet!
              </Paragraph>
            ) : null}
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)} fg={1}>
          <AnimatedStack pb="$5" borderColor={isCompleted ? '$background' : '$grey-100'} style={animatedStyle}>
            <FunkeCredentialCard
              issuerImage={display.issuer.logo}
              textColor={display.textColor}
              name={display.name}
              backgroundImage={display.backgroundImage}
              bgColor={display.backgroundColor}
              isLoading={isStoring && !isCompleted}
            />
          </AnimatedStack>
          <AnimatedStack
            fg={1}
            btw="$0.5"
            px="$4"
            mx="$-4"
            borderColor={isScrolledByOffset && !isStoringOrCompleted ? '$grey-200' : '$background'}
            onLayout={(event) => {
              if (!scrollViewHeight) {
                setScrollViewHeight(event.nativeEvent.layout.height)
              }
            }}
          >
            {!isStoringOrCompleted && attributes ? (
              <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={scrollEventThrottle}
                px="$4"
                mx="$-4"
                maxHeight={scrollViewHeight}
                bg="$white"
              >
                <CredentialAttributes subject={attributes} />
                <Spacer size="$6" />
              </ScrollView>
            ) : (
              <Spacer size="$6" />
            )}
          </AnimatedStack>
        </AnimatedStack>
      </AnimatedStack>
      <AnimatedStack
        key={isCompleted ? 'success' : 'error'}
        layout={LinearTransition}
        entering={isCompleted ? FadeIn.duration(300).delay(500) : undefined}
        exiting={FadeOut.duration(100)}
        btw="$0.5"
        borderColor={isStoringOrCompleted ? '$background' : '$grey-200'}
        p="$4"
        mx="$-4"
        bg="$background"
      >
        {isStoringOrCompleted ? (
          <Button.Solid opacity={isCompleted ? 1 : 0} onPress={onComplete}>
            Go to wallet <HeroIcons.ArrowRight size={20} color="$white" />
          </Button.Solid>
        ) : (
          <DualResponseButtons align="horizontal" onAccept={handleAccept} onDecline={handleDecline} />
        )}
      </AnimatedStack>
    </YStack>
  )
}
