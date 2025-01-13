import {
  Blob,
  Button,
  FlexPage,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  Paragraph,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import type React from 'react'
import { Alert } from 'react-native'

import appIcon from '../../../../assets/icon.png'

export interface OnboardingWelcomeProps {
  goToNextStep: () => void
}

export default function OnboardingWelcome({ goToNextStep }: OnboardingWelcomeProps) {
  return (
    <YStack fg={1} pos="relative">
      <YStack pos="absolute" h="50%" w="100%">
        <Blob />
        <YStack
          transform={[{ translateX: -48 }]} // Half of the image width (96/2)
          pos="absolute"
          br="$6"
          top="40%"
          left="50%"
          ov="hidden"
          ai="center"
          jc="center"
        >
          <Image height={96} width={96} src={appIcon} />
        </YStack>
      </YStack>
      <FlexPage safeArea="y" p={0} fg={1} jc="space-between" backgroundColor="$transparent">
        <YStack px="$4" gap="$4" flex-1 justifyContent="space-between">
          <YStack ai="flex-end">
            <IconContainer
              aria-label="Info"
              icon={<HeroIcons.QuestionMarkCircle />}
              onPress={() => {
                Alert.alert(
                  'This is the EasyPID wallet',
                  '\nThis is your digital wallet. With it, you can store and share information about yourself.'
                )
              }}
            />
          </YStack>
          <Stack h="$11" />
          <YStack gap="$4" jc="center" ai="center">
            <Heading fontSize={32}>Paradym Wallet</Heading>
            <Paragraph px="$2" ta="center">
              This is your digital wallet. With it, you can store and share information about yourself.
            </Paragraph>
          </YStack>
          <XStack gap="$2">
            <Button.Solid flexGrow={1} onPress={goToNextStep}>
              Get Started
            </Button.Solid>
          </XStack>
        </YStack>
      </FlexPage>
    </YStack>
  )
}
