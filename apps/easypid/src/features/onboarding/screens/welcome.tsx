import {
  Button,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  Paragraph,
  Stack,
  XStack,
  YStack,
  useToastController,
} from '@package/ui'
import { Image } from '@tamagui/image'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Alert, Dimensions } from 'react-native'

import { generateKeypair } from '@animo-id/expo-secure-environment'
import welcomeBackground from '../../../../assets/home-bg.png'

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
    return toast.show("B' flow is currently unavailable", {
      type: 'warning',
      customData: {
        preset: 'warning',
      },
    })
    // const newFlow = selectedFlow === 'c' ? 'bprime' : 'c'
    // setSelectedFlow(newFlow)
    // toast.show(`${readableFlow[newFlow]} flow activated!`, {
    //   type: 'info',
    //   message: `You are now using the ${readableFlow[newFlow]} flow.`,
    // })
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
    <YStack fg={1} pos="relative">
      <Image
        pos="absolute"
        source={welcomeBackground}
        resizeMode="cover"
        h={Dimensions.get('window').height / 1.8}
        mt="$-4"
        w="100%"
        top={0}
      />
      <FlexPage p={0} fg={1} jc="space-between" backgroundColor="$transparent">
        <YStack px="$4" gap="$4" flex-1 justifyContent="space-between">
          <YStack ai="flex-end">
            <IconContainer
              aria-label="Info"
              icon={<HeroIcons.QuestionMarkCircle />}
              p="$2"
              onPress={() => {
                Alert.alert(
                  'This is the EasyPID wallet',
                  `\nThis is your digital wallet. With it, you can store and share information about yourself. \n\n You can switch between the C and B' flow by pressing the grey button in the bottom left.`
                )
              }}
            />
          </YStack>
          <Stack h="$10" />
          <YStack gap="$4" jc="center" ai="center">
            <Heading fontSize={32}>Animo EasyPID</Heading>
            <Paragraph px="$2" ta="center">
              This is your digital wallet. With it, you can store and share information about yourself.
            </Paragraph>
          </YStack>
          <XStack gap="$2">
            <Button.Outline scaleOnPress fg={0} width="$buttonHeight" bg="$grey-100" onPress={onPressFlow}>
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
    </YStack>
  )
}
