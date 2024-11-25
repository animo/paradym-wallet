import { AnimatedStack, Button, Heading, HeroIcons, Paragraph, XStack, YStack, useSpringify } from '@package/ui'
import React, { useRef, useState } from 'react'

import { Dimensions } from 'react-native'
import { LinearTransition } from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import type { ICarouselInstance } from 'react-native-reanimated-carousel'

import { useImageScaler } from 'packages/app/src/hooks'
import { ScanCard } from './assets/ScanCard'
import { WalletExplanation } from './assets/WalletExplanation'
import { WalletHowItWorks } from './assets/WalletHowItWorks'
import { WalletStoring } from './assets/WalletStoring'

interface OnboardingWalletExplanationProps {
  onSkip: () => void
  goToNextStep: () => void
}

const SLIDES = [
  {
    image: <ScanCard />,
    title: 'This is your wallet',
    subtitle:
      'Add digital cards with your information, and  share them easily with others. It’s like having your wallet on your phone.',
  },
  {
    image: <WalletStoring />,
    title: 'What is it for?',
    subtitle:
      'The digital wallet stores your important information all in one place on your phone. It’s a secure and easy way to carry everything you need without using a physical wallet.',
  },
  {
    image: <WalletHowItWorks />,
    title: 'How does it work?',
    subtitle:
      'Add your cards and documents by scanning QR codes. When organizations request your data, you can review and share with a tap in the app. Your information is always secure with your PIN or fingerprint.',
  },
]

export function OnboardingWalletExplanation({ onSkip, goToNextStep }: OnboardingWalletExplanationProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { width } = Dimensions.get('window')
  const carouselRef = useRef<ICarouselInstance>(null)
  const { height, onLayout } = useImageScaler()

  const handleNext = () => {
    if (currentSlide === SLIDES.length - 1) {
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
          data={SLIDES}
          pagingEnabled={true}
          snapEnabled={true}
          style={{ width: '100%' }}
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
          {SLIDES.map((_, index) => (
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
            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Button.Solid>
          {currentSlide !== SLIDES.length - 1 && (
            <Button.Text onPress={onSkip}>
              <HeroIcons.ArrowRight color="$primary-500" size={20} /> Skip explanation
            </Button.Text>
          )}
        </YStack>
      </AnimatedStack>
    </YStack>
  )
}
