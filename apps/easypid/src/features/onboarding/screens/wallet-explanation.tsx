import {
  AnimatedStack,
  Button,
  Heading,
  HeroIcons,
  IllustrationContainer,
  Paragraph,
  XStack,
  YStack,
  useSpringify,
} from '@package/ui'
import { Image } from '@tamagui/image'
import React, { useState } from 'react'

import { LinearTransition, SlideInRight, SlideOutLeft } from 'react-native-reanimated'
import appIcon from '../../../../assets/icon.png'

interface OnboardingWalletExplanationProps {
  onSkip: () => void
  goToNextStep: () => void
}

const SLIDES = [
  {
    image: appIcon,
    title: 'This is your wallet',
    subtitle:
      'Add digital cards with your information, and  share them easily with others. It’s like having your wallet on your phone.',
  },
  {
    image: appIcon,
    title: 'What is it for?',
    subtitle:
      'The digital wallet stores your important information all in one place on your phone. It’s a secure and easy way to carry everything you need without using a physical wallet.',
  },
  {
    image: appIcon,
    title: 'Why is it useful?',
    subtitle:
      'The wallet lets you see exactly what data is being requested, and you control whether to share it or not. In many cases sharing data digitally can be faster and more secure.',
  },
  {
    image: appIcon,
    title: 'How does it work?',
    subtitle:
      'Add your cards and documents by scanning QR codes. When organizations request your data, you can review and share with a tap in the app. Your information is always secure with your PIN or fingerprint.',
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
    <YStack fg={1} gap="$6" jc="space-between">
      <AnimatedStack
        flexDirection="column"
        key={currentSlide}
        entering={useSpringify(SlideInRight)}
        exiting={useSpringify(SlideOutLeft)}
        flex={1}
        gap="$3"
        mt="$-4"
      >
        <Heading variant="h1">{SLIDES[currentSlide].title}</Heading>
        <Paragraph>{SLIDES[currentSlide].subtitle}</Paragraph>
        <IllustrationContainer variant="feature">
          <Image br="$6" source={SLIDES[currentSlide].image} width={64} height={64} />
        </IllustrationContainer>
      </AnimatedStack>

      {/* Slide indicators */}
      <AnimatedStack flexDirection="row" jc="center" gap="$2" mt="$4">
        {SLIDES.map((_, index) => (
          <AnimatedStack
            key={`indicator-${index}-${currentSlide === index}`}
            h="$0.75"
            layout={useSpringify(LinearTransition)}
            w={currentSlide === index ? '$2' : '$1'}
            br="$12"
            bg={currentSlide === index ? '$primary-500' : '$grey-100'}
          />
        ))}
      </AnimatedStack>

      <YStack gap="$4">
        <Button.Text onPress={onSkip}>
          <HeroIcons.ArrowRight size={20} /> Skip explanation
        </Button.Text>
        <Button.Solid onPress={handleNext}>
          {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
