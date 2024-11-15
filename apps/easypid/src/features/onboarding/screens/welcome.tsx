import {
  Button,
  CircleContainer,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  IllustrationContainerBackground,
  Paragraph,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import { useToastController } from '@package/ui'
import { Image } from '@tamagui/image'
import type React from 'react'
import { useEffect } from 'react'
import { Alert } from 'react-native'
import Animated, { FadingTransition } from 'react-native-reanimated'

import { setFallbackSecureEnvironment } from '@animo-id/expo-secure-environment'
import { WalletServiceProviderClient } from '@easypid/crypto/WalletServiceProviderClient'
import inAppLogo from '../../../../assets/icon.png'

export interface OnboardingWelcomeProps {
  goToNextStep: () => void
}

export default function OnboardingWelcome({ goToNextStep }: OnboardingWelcomeProps) {
  const toast = useToastController()

  useEffect(() => {
    // TODO: walletServiceProvider should be in a react context so we can reuse it in other components
    const walletServiceProviderAuthToken = process.env.EXPO_PUBLIC_WALLET_SERVICE_PROVIDER_AUTH_TOKEN
    const walletServiceProviderUrl = process.env.EXPO_PUBLIC_WALLET_SERVICE_PROVIDER_URL
    const walletServiceProvider = new WalletServiceProviderClient(
      walletServiceProviderAuthToken as string,
      walletServiceProviderUrl as string
    )
    setFallbackSecureEnvironment(walletServiceProvider)
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
            <Button.Solid
              flexGrow={1}
              onPress={ goToNextStep}
            >
              Get Started
            </Button.Solid>
          </XStack>
        </YStack>
      </FlexPage>
    </Animated.View>
  )
}
