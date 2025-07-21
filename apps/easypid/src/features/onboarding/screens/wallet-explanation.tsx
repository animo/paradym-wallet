import { AnimatedStack, Button, Heading, HeroIcons, Paragraph, XStack, YStack, useSpringify } from '@package/ui'
import { useRef, useState } from 'react'
import { Dimensions } from 'react-native'
import { LinearTransition } from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import type { ICarouselInstance } from 'react-native-reanimated-carousel'

import { useLingui } from '@lingui/react/macro'
import { useImageScaler } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import { WalletExplanation } from './assets/WalletExplanation'
import { WalletHowItWorks } from './assets/WalletHowItWorks'
import { WalletStoring } from './assets/WalletStoring'

interface OnboardingWalletExplanationProps {
  onSkip: () => void
  goToNextStep: () => void
}

export function OnboardingWalletExplanation({ onSkip, goToNextStep }: OnboardingWalletExplanationProps) {
  const { t } = useLingui()
  const [currentSlide, setCurrentSlide] = useState(0)
  const { width } = Dimensions.get('window')
  const carouselRef = useRef<ICarouselInstance>(null)
  const { height, onLayout } = useImageScaler()

  const slides = [
    {
      image: <WalletExplanation />,
      title: t({
        id: 'onboardingWalletExplanation.slide1.title',
        message: 'This is your wallet',
        comment: 'Title for first slide of wallet onboarding',
      }),
      subtitle: t({
        id: 'onboardingWalletExplanation.slide1.subtitle',
        message:
          'Add digital cards with your information, and  share them easily with others. It’s like having your wallet on your phone.',
        comment: 'Subtitle for first slide of wallet onboarding',
      }),
    },
    {
      image: <WalletStoring />,
      title: t({
        id: 'onboardingWalletExplanation.slide2.title',
        message: 'What is it for?',
        comment: 'Title for second slide of wallet onboarding',
      }),
      subtitle: t({
        id: 'onboardingWalletExplanation.slide2.subtitle',
        message:
          'The digital wallet stores your important information all in one place on your phone. It’s a secure and easy way to carry everything you need without using a physical wallet.',
        comment: 'Subtitle for second slide of wallet onboarding',
      }),
    },
    {
      image: <WalletHowItWorks />,
      title: t({
        id: 'onboardingWalletExplanation.slide3.title',
        message: 'How does it work?',
        comment: 'Title for third slide of wallet onboarding',
      }),
      subtitle: t({
        id: 'onboardingWalletExplanation.slide3.subtitle',
        message:
          'Add your cards and documents by scanning QR codes. When organizations request your data, you can review and share with a tap in the app. Your information is always secure with your PIN or fingerprint.',
        comment: 'Subtitle for third slide of wallet onboarding',
      }),
    },
  ]

  const getStartedLabel = t({
    id: 'onboardingWalletExplanation.getStarted',
    message: 'Get Started',
    comment: 'Button label to finish onboarding explanation',
  })

  const skipLabel = t({
    id: 'onboardingWalletExplanation.skip',
    message: 'Skip explanation',
    comment: 'Button label to skip wallet explanation slides',
  })

  const continueLabel = t(commonMessages.continue)

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      goToNextStep()
    } else {
      carouselRef.current?.next()
    }
  }

  return (
    <YStack fg={1} gap="$6" jc="space-between">
      <YStack fg={1} mt="$-5">
        <Carousel
          ref={carouselRef}
          loop={false}
          width={width}
          data={slides}
          pagingEnabled={true}
          snapEnabled={true}
          containerStyle={{ width: '100%', flex: 1 }}
          onProgressChange={(_, absoluteProgress) => {
            // Snap to item on 50% progress
            const nextIndex = Math.round(absoluteProgress)
            if (nextIndex !== currentSlide) {
              setCurrentSlide(nextIndex)
            }
          }}
          renderItem={({ item }) => (
            <AnimatedStack flexDirection="column" flex={1} gap="$3" pr={36}>
              <Heading variant="h1">{item.title}</Heading>
              <Paragraph>{item.subtitle}</Paragraph>
              <YStack ai="center" f={1} onLayout={onLayout} pos="relative">
                <YStack height={height} mt="$4">
                  {item.image}
                </YStack>
              </YStack>
            </AnimatedStack>
          )}
        />
      </YStack>

      <AnimatedStack flexDirection="column" gap="$6" layout={useSpringify(LinearTransition)}>
        {/* Slide indicators */}
        <XStack jc="center" gap="$2">
          {slides.map((_, index) => (
            <AnimatedStack
              key={`indicator-${index}-${currentSlide === index}`}
              h="$0.75"
              layout={useSpringify(LinearTransition)}
              w={currentSlide === index ? 32 : 16}
              br="$12"
              bg={currentSlide === index ? '$primary-500' : '$grey-100'}
            />
          ))}
        </XStack>
        <YStack gap="$4">
          <Button.Solid onPress={handleNext}>
            {currentSlide === slides.length - 1 ? getStartedLabel : continueLabel}
          </Button.Solid>
          {currentSlide !== slides.length - 1 && (
            <Button.Text onPress={onSkip}>
              <HeroIcons.ArrowRight color="$primary-500" size={20} /> {skipLabel}
            </Button.Text>
          )}
        </YStack>
      </AnimatedStack>
    </YStack>
  )
}
