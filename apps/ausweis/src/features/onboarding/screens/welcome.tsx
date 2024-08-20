import { Button, FlexPage, Heading, HeroIcons, Logo, Separator, Stack, XStack, YStack } from '@package/ui'
import { Image } from '@tamagui/image'
import React, { useState } from 'react'
import { Alert } from 'react-native'
import Animated, { FadingTransition } from 'react-native-reanimated'
import inAppLogo from '../../../../assets/icon.png'

export interface OnboardingWelcomeProps {
  goToNextStep: (selectedFlow: 'c' | 'bprime') => void
}

export default function OnboardingWelcome({ goToNextStep }: OnboardingWelcomeProps) {
  const [selectedFlow, setSelectedFlow] = useState<'c' | 'bprime'>('c')

  return (
    <Animated.View style={{ flexGrow: 1 }} layout={FadingTransition}>
      <FlexPage p={0} fg={1} jc="space-between">
        <YStack px="$4" gap="$4" flex-1 justifyContent="space-between">
          {/* This stack ensures the right spacing  */}
          <YStack ai="flex-end">
            <Stack
              p="$2"
              onPress={() => {
                Alert.alert('Help!')
              }}
            >
              <HeroIcons.QuestionMarkCircle color="$grey-900" />
            </Stack>
          </YStack>
          <YStack gap="$4" jc="center" ai="center">
            <Image br="$6" source={inAppLogo} width={64} height={64} />
            <Heading>Ausweis Wallet</Heading>
          </YStack>
          <XStack gap="$2">
            <Button.Outline
              p="$0"
              width="$buttonHeight"
              bg="$grey-100"
              pressStyle={{
                bg: '$grey-200',
              }}
              onPress={() => setSelectedFlow((selectedFlow) => (selectedFlow === 'c' ? 'bprime' : 'c'))}
            >
              <Heading variant="h2" fontWeight="bold">
                {selectedFlow === 'c' ? 'C' : "B'"}
              </Heading>
            </Button.Outline>
            <Button.Solid flexGrow={1} onPress={() => goToNextStep(selectedFlow)}>
              Get Started
            </Button.Solid>
          </XStack>
        </YStack>
      </FlexPage>
    </Animated.View>
  )
}
