import { AnimatedStack, Button, Heading, HeroIcons, IllustrationContainer, XStack, YStack } from '@package/ui'
import { Image } from '@tamagui/image'
import React, { useState } from 'react'

import { FadeInRight, FadeOutLeft } from 'react-native-reanimated'
import appIcon from '../../../../assets/icon.png'

interface OnboardingWalletExplanationProps {
  onSkip: () => void
  goToNextStep: () => void
}

const SLIDES = [
  {
    image: appIcon,
    title: 'Slide 1',
  },
  {
    image: appIcon,
    title: 'Slide 2',
  },
  {
    image: appIcon,
    title: 'Slide 3',
  },
  {
    image: appIcon,
    title: 'Slide 4',
  },
]

export function OnboardingWalletExplanation({ onSkip, goToNextStep }: OnboardingWalletExplanationProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide === SLIDES.length - 1) {
      goToNextStep()
    } else {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentSlide((prev) => prev - 1)
  }

  return (
    <YStack fg={1} jc="space-between">
      <AnimatedStack
        flexDirection="column"
        key={currentSlide}
        entering={FadeInRight.delay(100).duration(150)}
        exiting={FadeOutLeft.duration(150)}
        flex={1}
        mt="$-6"
        gap="$3"
      >
        <Heading variant="h1">{SLIDES[currentSlide].title}</Heading>
        <IllustrationContainer variant="feature">
          <Image br="$6" source={SLIDES[currentSlide].image} width={64} height={64} />
        </IllustrationContainer>
      </AnimatedStack>

      <YStack gap="$4">
        {/* Slide indicators */}
        <XStack jc="center" gap="$2" mt="$4">
          {SLIDES.map((_, index) => (
            <YStack
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={index}
              h="$0.75"
              w="$1"
              br="$12"
              bg={currentSlide === index ? '$primary-500' : '$grey-100'}
            />
          ))}
        </XStack>
        <XStack jc="center">
          <Button.Text onPress={onSkip}>
            <HeroIcons.ArrowRight size={20} /> Skip introduction
          </Button.Text>
        </XStack>
        <Button.Solid onPress={handleNext}>
          {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
