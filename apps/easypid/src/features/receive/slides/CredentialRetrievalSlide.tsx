import type { CredentialDisplay } from '@package/agent'
import {
  AnimatedStack,
  Button,
  Heading,
  HeroIcons,
  Paragraph,
  XStack,
  YStack,
  useInitialRender,
  useSpringify,
} from '@package/ui'
import * as Haptics from 'expo-haptics'
import { FunkeCredentialCard, useWizard } from 'packages/app/src'
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
  display: CredentialDisplay
  isCompleted: boolean
  onGoToWallet: () => void
}

export const CredentialRetrievalSlide = ({ display, isCompleted, onGoToWallet }: CredentialRetrievalSlideProps) => {
  const { completeProgressBar } = useWizard()
  const isInitialRender = useInitialRender()
  const [isAllowedToComplete, setIsAllowedToComplete] = useState(false)
  const scale = useSharedValue(1)
  const isCompleteAndAllowed = isAllowedToComplete && isCompleted

  useEffect(() => {
    if (isCompleteAndAllowed) {
      scale.value = withSpring(1, {
        damping: 4,
        stiffness: 80,
        mass: 0.3,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      })
    } else {
      scale.value = withTiming(0.9, { duration: 2000 })
    }
  }, [isCompleteAndAllowed, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  }, [])

  // Slow haptic when isStoring and a hard tick when isCompleted
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (isCompleteAndAllowed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } else {
      interval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }, 300)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isCompleteAndAllowed])

  // Delay the completion by 1 second to show the storing animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAllowedToComplete(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Wait for the credential to be accepted and the minimum animation time to be reached
  useEffect(() => {
    if (isCompleteAndAllowed) {
      completeProgressBar()
    }
  }, [isCompleteAndAllowed, completeProgressBar])

  return (
    <YStack fg={1} jc="space-between">
      <AnimatedStack gap="$4" fg={1}>
        <AnimatedStack key="success-icon" opacity={isCompleteAndAllowed ? 1 : 0} entering={useSpringify(ZoomIn)}>
          <XStack pt="$4" jc="center">
            <HeroIcons.ShieldCheckFilled color="$primary-500" size={48} />
          </XStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack
            key={isCompleteAndAllowed ? 'success-title' : 'info-title'}
            entering={!isInitialRender ? FadeIn.duration(300) : undefined}
            opacity={isCompleteAndAllowed ? 1 : 0}
            exiting={FadeOut.duration(100)}
          >
            <Heading ta="center">Success!</Heading>
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack
            key={isCompleteAndAllowed ? 'success-text' : 'info-text'}
            entering={!isInitialRender ? FadeIn.duration(300) : undefined}
            opacity={isCompleteAndAllowed ? 1 : 0}
            exiting={FadeOut.duration(100)}
          >
            <Paragraph ta="center" mt="$-2" mb="$6">
              Card successfully added to your wallet!
            </Paragraph>
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
              isLoading={!isCompleteAndAllowed}
            />
          </AnimatedStack>
          {/* TODO: render attributes when retrieved? */}
          {/* <AnimatedStack
            fg={1}
            btw="$0.5"
            px="$4"
            mx="$-4"
            borderColor={isScrolledByOffset && !isCompleted ? '$grey-200' : '$background'}
            onLayout={(event) => {
              if (!scrollViewHeight) {
                setScrollViewHeight(event.nativeEvent.layout.height)
              }
            }}
          >
            {!isCompleted && attributes ? (
              <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={scrollEventThrottle}
                px="$4"
                mx="$-4"
                maxHeight={scrollViewHeight}
                bg="$white"
              >
                <CredentialAttributes
                  headerStyle="small"
                  borderStyle="large"
                  attributeWeight="medium"
                  subject={attributes}
                  disableHeader
                />
                <Spacer size="$6" />
              </ScrollView>
            ) : (
              <Spacer size="$6" />
            )}
          </AnimatedStack> */}
        </AnimatedStack>
      </AnimatedStack>
      <AnimatedStack
        key={isCompleteAndAllowed ? 'success' : 'error'}
        layout={LinearTransition}
        entering={isCompleteAndAllowed ? FadeIn.duration(300).delay(500) : undefined}
        exiting={FadeOut.duration(100)}
        btw="$0.5"
        borderColor={isCompleteAndAllowed ? '$background' : '$grey-200'}
        p="$4"
        mx="$-4"
        bg="$background"
      >
        <Button.Solid opacity={isCompleteAndAllowed ? 1 : 0} onPress={onGoToWallet}>
          Go to wallet <HeroIcons.ArrowRight size={20} color="$white" />
        </Button.Solid>
      </AnimatedStack>
    </YStack>
  )
}
