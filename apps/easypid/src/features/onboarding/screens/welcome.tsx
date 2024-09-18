import {
  Button,
  CircleContainer,
  FlexPage,
  Heading,
  HeroIcons,
  IllustrationContainerBackground,
  Paragraph,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import { useToastController } from '@package/ui'
import { Image } from '@tamagui/image'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import Animated, { FadingTransition } from 'react-native-reanimated'

import { generateKeypair } from '@animo-id/expo-secure-environment'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import inAppLogo from '../../../../assets/icon.png'

export interface OnboardingWelcomeProps {
  goToNextStep: (selectedFlow: 'c' | 'bprime') => void
}

const readableFlow = {
  c: 'C',
  bprime: "B'",
}

export default function OnboardingWelcome({ goToNextStep }: OnboardingWelcomeProps) {
  const toast = useToastController()
  const [selectedFlow, setSelectedFlow] = useState<'c' | 'bprime'>('c')
  const [isBlockedByHsm, setIsBlockedByHsm] = useState(false)

  const onPressFlow = () => {
    const newFlow = selectedFlow === 'c' ? 'bprime' : 'c'
    setSelectedFlow(newFlow)
    toast.show(`${readableFlow[newFlow]} flow activated!`, {
      type: 'info',
      message: `You are now using the ${readableFlow[newFlow]} flow.`,
    })
  }

  useEffect(() => {
    try {
      generateKeypair('123', false)
    } catch (error) {
      setIsBlockedByHsm(true)
      Alert.alert(
        'Your device is not supported',
        'This device does not have a secure enclave. This is required as an additional layer of security for your digital identity. Unfortunately, this means you are unable to use the EasyPID wallet with this device.'
      )
    }
  }, [])

  return (
    <Animated.View style={{ flexGrow: 1 }} layout={FadingTransition}>
      <Stack
        h="60%"
        w="150%"
        mt="-10%"
        left="-25%"
        bg="#D5DDF0CC"
        position="absolute"
        top={0}
        flex={1}
        ai="center"
        jc="flex-end"
        br={200}
        overflow="hidden"
      >
        <IllustrationContainerBackground />
        <YStack mb="$10">
          <CircleContainer>
            <Image br="$6" source={inAppLogo} width={64} height={64} />
          </CircleContainer>
        </YStack>
      </Stack>
      <FlexPage p={0} fg={1} jc="space-between" bg="#00000000">
        <YStack px="$4" gap="$4" flex-1 justifyContent="space-between">
          <YStack ai="flex-end">
            <Stack
              p="$2"
              onPress={() => {
                Alert.alert(
                  'This is the EasyPID wallet',
                  `\nThis is your digital wallet. With it, you can store and share information about yourself. \n\n You can switch between the C and B' flow by pressing the grey button in the bottom left.`
                )
              }}
            >
              <HeroIcons.QuestionMarkCircle color="$grey-900" />
            </Stack>
          </YStack>
          <Stack h="$10" />
          <YStack gap="$4" jc="center" ai="center">
            <Heading fontSize={32}>Animo EasyPID</Heading>
            <Paragraph px="$2" ta="center">
              This is your digital wallet. With it, you can store and share information about yourself.
            </Paragraph>
          </YStack>
          <XStack gap="$2">
            <Button.Outline
              scaleOnPress
              fg={0}
              width="$buttonHeight"
              bg="$grey-100"
              color="$grey-900"
              borderColor="$grey-200"
              onPress={onPressFlow}
            >
              <Paragraph fontWeight="$semiBold">{selectedFlow === 'c' ? 'C' : "B'"}</Paragraph>
            </Button.Outline>
            <Button.Solid
              opacity={isBlockedByHsm ? 0.8 : 1}
              flexGrow={1}
              scaleOnPress={!isBlockedByHsm}
              onPress={() => {
                if (isBlockedByHsm) {
                  toast.show('Your device is not supported', {
                    type: 'error',
                    message:
                      'Your device does not have a secure enclave. This is required as an additional layer of security for your digital identity.',
                  })
                } else {
                  goToNextStep(selectedFlow)
                }
              }}
            >
              Get Started
            </Button.Solid>
          </XStack>
        </YStack>
      </FlexPage>
    </Animated.View>
  )
}
